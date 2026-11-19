import json
import math
from collections import defaultdict
from typing import Any
from sqlalchemy.orm import Session

from models.raw_event import RawEvent


class EnergyService:
    EPSILON = 1e-12

    @staticmethod
    def _load_raw_events(db: Session, datasource_id: int):
        events = (
            db.query(RawEvent)
            .filter(RawEvent.datasource_id == datasource_id)
            .order_by(RawEvent.case_id.asc(), RawEvent.timestamp.asc(), RawEvent.id.asc())
            .all()
        )

        if not events:
            raise ValueError("No standardized raw_events found for this datasource")

        return events

    @staticmethod
    def _parse_context(context_data: str | None) -> dict[str, Any]:
        if not context_data:
            return {}
        try:
            data = json.loads(context_data)
            return data if isinstance(data, dict) else {}
        except Exception:
            return {}

    @staticmethod
    def _context_to_key(context: dict[str, Any]) -> str:
        """
        Transforme le contexte en clé stable pour les stats.
        """
        if not context:
            return "__NO_CONTEXT__"

        items = sorted((str(k), str(v)) for k, v in context.items())
        return json.dumps(items, ensure_ascii=False)

    @staticmethod
    def build_transitions(db: Session, datasource_id: int):
        events = EnergyService._load_raw_events(db, datasource_id)

        traces: dict[str, list[dict[str, Any]]] = defaultdict(list)

        for event in events:
            traces[str(event.case_id)].append(
                {
                    "activity": event.activity,
                    "timestamp": event.timestamp,
                    "resource": event.resource,
                    "context": EnergyService._parse_context(event.context_data),
                }
            )

        transitions = []

        for case_id, case_events in traces.items():
            if len(case_events) < 2:
                continue

            for i in range(len(case_events) - 1):
                current_event = case_events[i]
                next_event = case_events[i + 1]

                context = current_event.get("context", {})
                context_key = EnergyService._context_to_key(context)

                transitions.append(
                    {
                        "case_id": case_id,
                        "from_state": current_event["activity"],
                        "to_state": next_event["activity"],
                        "context": context,
                        "context_key": context_key,
                    }
                )

        if not transitions:
            raise ValueError("Not enough events to build transitions")

        return transitions

    @staticmethod
    def compute_transition_statistics(
        db: Session,
        datasource_id: int,
        alpha: float = 1.0,
        min_context_support: int = 3,
    ):
        transitions = EnergyService.build_transitions(db, datasource_id)

        transition_counts = defaultdict(int)
        outgoing_counts = defaultdict(int)

        contextual_transition_counts = defaultdict(int)
        contextual_outgoing_counts = defaultdict(int)

        targets_by_source = defaultdict(set)

        for t in transitions:
            source = t["from_state"]
            target = t["to_state"]
            context_key = t["context_key"]

            transition_counts[(source, target)] += 1
            outgoing_counts[source] += 1

            contextual_transition_counts[(source, target, context_key)] += 1
            contextual_outgoing_counts[(source, context_key)] += 1

            targets_by_source[source].add(target)

        stats = []

        for t in transitions:
            source = t["from_state"]
            target = t["to_state"]
            context = t["context"]
            context_key = t["context_key"]

            global_count = transition_counts[(source, target)]
            global_outgoing = outgoing_counts[source]

            contextual_count = contextual_transition_counts[(source, target, context_key)]
            contextual_outgoing = contextual_outgoing_counts[(source, context_key)]

            possible_targets = len(targets_by_source[source])
            possible_targets = max(possible_targets, 1)

            # Global probability with Laplace smoothing
            p_global = (global_count + alpha) / (
                global_outgoing + alpha * possible_targets
            )

            # If context is too rare, fallback to global probability
            if contextual_outgoing < min_context_support:
                p_context = p_global
                context_reliable = False
            else:
                p_context = (contextual_count + alpha) / (
                    contextual_outgoing + alpha * possible_targets
                )
                context_reliable = True

            p_global = max(p_global, EnergyService.EPSILON)
            p_context = max(p_context, EnergyService.EPSILON)

            e_int = -math.log(p_global)
            e_ext = -math.log(p_context / p_global)
            e_total = -math.log(p_context)

            stats.append(
                {
                    "case_id": t["case_id"],
                    "from_state": source,
                    "to_state": target,
                    "context": context,

                    "global_count": global_count,
                    "global_outgoing": global_outgoing,
                    "contextual_count": contextual_count,
                    "contextual_outgoing": contextual_outgoing,
                    "context_reliable": context_reliable,

                    "p_global": p_global,
                    "p_context": p_context,

                    "e_int": e_int,
                    "e_ext": e_ext,
                    "e_total": e_total,
                }
            )

        stats.sort(key=lambda x: x["e_total"], reverse=True)
        return stats
    @staticmethod
    def compute_trace_energies(db: Session, datasource_id: int):
        transition_stats = EnergyService.compute_transition_statistics(db, datasource_id)

        trace_energies = defaultdict(lambda: {
            "trace_energy": 0.0,
            "transition_count": 0,
            "transitions": []
        })

        for stat in transition_stats:
            case_id = stat["case_id"]

            trace_energies[case_id]["trace_energy"] += stat["e_total"]
            trace_energies[case_id]["transition_count"] += 1
            trace_energies[case_id]["transitions"].append(stat)

        result = []
        for case_id, data in trace_energies.items():
            avg_energy = (
                data["trace_energy"] / data["transition_count"]
                if data["transition_count"] > 0 else 0.0
            )

            result.append(
                {
                    "case_id": case_id,
                    "trace_energy": data["trace_energy"],
                    "avg_transition_energy": avg_energy,
                    "transition_count": data["transition_count"],
                    "transitions": data["transitions"],
                }
            )

        result.sort(key=lambda x: x["trace_energy"], reverse=True)
        return result

    @staticmethod
    def compute_entropy(db: Session, datasource_id: int):
        transitions = EnergyService.build_transitions(db, datasource_id)

        transition_counts = defaultdict(int)
        outgoing_counts = defaultdict(int)

        for t in transitions:
            source = t["from_state"]
            target = t["to_state"]
            transition_counts[(source, target)] += 1
            outgoing_counts[source] += 1

        total_energy = 0.0
        total_transitions = 0

        for (source, target), count in transition_counts.items():
            p = count / outgoing_counts[source]
            p = max(p, EnergyService.EPSILON)

            # Contribution pondérée
            total_energy += count * (-math.log(p))
            total_transitions += count

        entropy = total_energy / total_transitions if total_transitions > 0 else 0.0

        return {
            "entropy": entropy,
            "total_transitions": total_transitions,
            "unique_transitions": len(transition_counts),
        }
    
    @staticmethod
    def compute_energy_summary(
        db: Session,
        datasource_id: int,
    ):
        stats = EnergyService.compute_transition_statistics(db, datasource_id)

        if not stats:
            raise ValueError("No energy data available")

        total_energy = sum(s["e_total"] for s in stats)
        avg_energy = total_energy / len(stats)

        max_energy = max(stats, key=lambda x: x["e_total"])
        min_energy = min(stats, key=lambda x: x["e_total"])

        reliable = [s for s in stats if s["context_reliable"]]
        unreliable = [s for s in stats if not s["context_reliable"]]

        return {
            "total_transitions": len(stats),
            "avg_energy": avg_energy,
            "max_energy": max_energy,
            "min_energy": min_energy,
            "reliable_context_ratio": len(reliable) / len(stats),
            "top_transitions": stats[:10],
            "unreliable_count": len(unreliable),
        }

    @staticmethod
    def compute_trace_anomaly_scores(db: Session, datasource_id: int):
        traces = EnergyService.compute_trace_energies(db, datasource_id)

        if not traces:
            raise ValueError("No trace energies available")

        values = [t["avg_transition_energy"] for t in traces]

        mean_energy = sum(values) / len(values)

        variance = sum((x - mean_energy) ** 2 for x in values) / len(values)
        std_energy = math.sqrt(variance)

        if std_energy == 0:
            std_energy = EnergyService.EPSILON

        results = []

        for trace in traces:
            z_score = (trace["avg_transition_energy"] - mean_energy) / std_energy

            if z_score >= 2:
                label = "high_anomaly"
            elif z_score >= 1:
                label = "medium_anomaly"
            else:
                label = "normal"

            results.append({
                "case_id": trace["case_id"],
                "trace_energy": trace["trace_energy"],
                "avg_transition_energy": trace["avg_transition_energy"],
                "transition_count": trace["transition_count"],
                "anomaly_score": z_score,
                "label": label,
            })

        results.sort(key=lambda x: x["anomaly_score"], reverse=True)

        return {
            "mean_energy": mean_energy,
            "std_energy": std_energy,
            "count": len(results),
            "traces": results,
        }
    
    @staticmethod
    def compute_energy_dfg(db: Session, datasource_id: int):
        stats = EnergyService.compute_transition_statistics(db, datasource_id)

        if not stats:
            raise ValueError("No energy transition data available")

        grouped = {}

        for s in stats:
            key = (s["from_state"], s["to_state"])

            if key not in grouped:
                grouped[key] = {
                    "from": s["from_state"],
                    "to": s["to_state"],
                    "count": 0,
                    "total_energy": 0.0,
                    "max_energy": 0.0,
                }

            grouped[key]["count"] += 1
            grouped[key]["total_energy"] += s["e_total"]
            grouped[key]["max_energy"] = max(grouped[key]["max_energy"], s["e_total"])

        edges = []

        for item in grouped.values():
            avg_energy = item["total_energy"] / item["count"]

            edges.append({
                "from": item["from"],
                "to": item["to"],
                "count": item["count"],
                "avg_energy": avg_energy,
                "max_energy": item["max_energy"],
            })

        edges.sort(key=lambda x: x["avg_energy"], reverse=True)

        nodes = sorted(
            list(
                set([edge["from"] for edge in edges] + [edge["to"] for edge in edges])
            )
        )

        return {
            "nodes": [{"id": node, "label": node} for node in nodes],
            "edges": edges,
        }