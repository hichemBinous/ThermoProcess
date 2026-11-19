import json
import math
from collections import Counter, defaultdict
from typing import Any

from sqlalchemy.orm import Session

from models.events import Event
from models.raw_event import RawEvent


class ContextDiscoveryService:
    EPSILON = 1e-12

    @staticmethod
    def _entropy(values: list[str]) -> float:
        counts = Counter(values)
        total = len(values)

        if total == 0:
            return 0.0

        entropy = 0.0
        for count in counts.values():
            p = count / total
            entropy -= p * math.log(max(p, ContextDiscoveryService.EPSILON))

        return entropy

    @staticmethod
    def _mutual_information(x_values: list[str], y_values: list[str]) -> float:
        if len(x_values) != len(y_values) or not x_values:
            return 0.0

        total = len(x_values)

        x_counts = Counter(x_values)
        y_counts = Counter(y_values)
        xy_counts = Counter(zip(x_values, y_values))

        mi = 0.0

        for (x, y), xy_count in xy_counts.items():
            p_xy = xy_count / total
            p_x = x_counts[x] / total
            p_y = y_counts[y] / total

            mi += p_xy * math.log(max(p_xy / (p_x * p_y), ContextDiscoveryService.EPSILON))

        return mi

    @staticmethod
    def _bucket_numeric(values: list[Any], bins: int = 4) -> dict[Any, str]:
        numeric_values = []

        for v in values:
            try:
                if v is not None and str(v).strip() != "":
                    numeric_values.append(float(v))
            except Exception:
                pass

        if len(numeric_values) < bins:
            return {v: str(v) for v in values}

        sorted_values = sorted(numeric_values)

        quantiles = []
        for i in range(1, bins):
            idx = int(len(sorted_values) * i / bins)
            quantiles.append(sorted_values[idx])

        mapping = {}

        for v in values:
            try:
                value = float(v)
                bucket = 0
                for q in quantiles:
                    if value > q:
                        bucket += 1
                mapping[v] = f"Q{bucket + 1}"
            except Exception:
                mapping[v] = "__MISSING__"

        return mapping

    @staticmethod
    def _is_numeric(values: list[Any]) -> bool:
        valid = 0
        numeric = 0

        for v in values:
            if v is None or str(v).strip() == "":
                continue

            valid += 1
            try:
                float(v)
                numeric += 1
            except Exception:
                pass

        if valid == 0:
            return False

        return numeric / valid >= 0.8

    @staticmethod
    def _get_candidate_columns(db: Session, datasource_id: int):
        events = (
            db.query(Event)
            .filter(Event.datasource_id == datasource_id)
            .limit(100)
            .all()
        )

        if not events:
            raise ValueError("No raw events found for this datasource")

        columns = set()

        for event in events:
            if event.row_data and isinstance(event.row_data, dict):
                columns.update(event.row_data.keys())

        excluded = {
            "case_id",
            "activity",
            "timestamp",
            "time",
            "date",
            "created_at",
            "updated_at",
        }

        return sorted([c for c in columns if c not in excluded])

    @staticmethod
    def _build_transition_dataset(db: Session, datasource_id: int, candidate_column: str):
        raw_events = (
            db.query(RawEvent)
            .filter(RawEvent.datasource_id == datasource_id)
            .order_by(RawEvent.case_id.asc(), RawEvent.timestamp.asc(), RawEvent.id.asc())
            .all()
        )

        if not raw_events:
            raise ValueError("No standardized raw_events found for this datasource")

        # raw events grouped by case
        traces = defaultdict(list)

        for ev in raw_events:
            context = {}
            if ev.context_data:
                try:
                    context = json.loads(ev.context_data)
                except Exception:
                    context = {}

            traces[str(ev.case_id)].append({
                "activity": ev.activity,
                "context_data": context,
            })

        samples = []

        for case_id, events in traces.items():
            if len(events) < 2:
                continue

            for i in range(len(events) - 1):
                source = events[i]["activity"]
                target = events[i + 1]["activity"]
                transition = f"{source} -> {target}"

                context_value = events[i]["context_data"].get(candidate_column)

                samples.append({
                    "case_id": case_id,
                    "source": source,
                    "target": target,
                    "transition": transition,
                    "context_value": context_value,
                })

        return samples

    @staticmethod
    def _compute_context_impact(samples: list[dict]):
        if not samples:
            return {
                "context_impact_score": 0.0,
                "avg_abs_e_ext": 0.0,
                "support_ratio": 0.0,
                "valid_samples": 0,
            }

        transition_counts = Counter(s["transition"] for s in samples)
        source_counts = Counter(s["source"] for s in samples)

        contextual_transition_counts = Counter(
            (s["source"], s["target"], s["context_value"]) for s in samples
        )

        contextual_source_counts = Counter(
            (s["source"], s["context_value"]) for s in samples
        )

        total_abs_e_ext = 0.0
        valid = 0
        reliable = 0

        for s in samples:
            source = s["source"]
            target = s["target"]
            context_value = s["context_value"]
            transition = s["transition"]

            global_count = transition_counts[transition]
            global_outgoing = source_counts[source]

            contextual_count = contextual_transition_counts[(source, target, context_value)]
            contextual_outgoing = contextual_source_counts[(source, context_value)]

            if global_outgoing == 0 or contextual_outgoing == 0:
                continue

            p_global = global_count / global_outgoing
            p_context = contextual_count / contextual_outgoing

            p_global = max(p_global, ContextDiscoveryService.EPSILON)
            p_context = max(p_context, ContextDiscoveryService.EPSILON)

            e_ext = -math.log(p_context / p_global)

            total_abs_e_ext += abs(e_ext)
            valid += 1

            if contextual_outgoing >= 3:
                reliable += 1

        if valid == 0:
            return {
                "context_impact_score": 0.0,
                "avg_abs_e_ext": 0.0,
                "support_ratio": 0.0,
                "valid_samples": 0,
            }

        avg_abs_e_ext = total_abs_e_ext / valid
        support_ratio = reliable / valid

        return {
            "context_impact_score": avg_abs_e_ext * support_ratio,
            "avg_abs_e_ext": avg_abs_e_ext,
            "support_ratio": support_ratio,
            "valid_samples": valid,
        }

    @staticmethod
    def analyze_candidate_contexts(db: Session, datasource_id: int):
        candidates = ContextDiscoveryService._get_candidate_columns(db, datasource_id)

        results = []

        for column in candidates:
            samples = ContextDiscoveryService._build_transition_dataset(
                db=db,
                datasource_id=datasource_id,
                candidate_column=column,
            )

            if not samples:
                continue

            raw_context_values = [s["context_value"] for s in samples]

            if ContextDiscoveryService._is_numeric(raw_context_values):
                bucket_map = ContextDiscoveryService._bucket_numeric(raw_context_values, bins=4)
                for s in samples:
                    s["context_value"] = bucket_map.get(s["context_value"], "__MISSING__")
                variable_type = "numeric_bucketed"
            else:
                for s in samples:
                    if s["context_value"] is None or str(s["context_value"]).strip() == "":
                        s["context_value"] = "__MISSING__"
                    else:
                        s["context_value"] = str(s["context_value"])
                variable_type = "categorical"

            context_values = [str(s["context_value"]) for s in samples]
            transitions = [s["transition"] for s in samples]

            mi = ContextDiscoveryService._mutual_information(context_values, transitions)

            global_entropy = ContextDiscoveryService._entropy(transitions)

            context_counts = Counter(context_values)
            total = len(samples)

            conditional_entropy = 0.0
            for ctx, count in context_counts.items():
                ctx_transitions = [
                    s["transition"]
                    for s in samples
                    if str(s["context_value"]) == ctx
                ]
                conditional_entropy += (count / total) * ContextDiscoveryService._entropy(ctx_transitions)

            entropy_gain = max(0.0, global_entropy - conditional_entropy)

            impact = ContextDiscoveryService._compute_context_impact(samples)

            cardinality = len(set(context_values))
            cardinality_penalty = 1 / math.log(cardinality + 2)

            final_score = (
                0.35 * mi
                + 0.30 * entropy_gain
                + 0.35 * impact["context_impact_score"]
            ) * impact["support_ratio"] * cardinality_penalty

            results.append({
                "column": column,
                "variable_type": variable_type,
                "cardinality": cardinality,
                "mutual_information": mi,
                "entropy_gain": entropy_gain,
                "context_impact_score": impact["context_impact_score"],
                "avg_abs_e_ext": impact["avg_abs_e_ext"],
                "support_ratio": impact["support_ratio"],
                "valid_samples": impact["valid_samples"],
                "final_score": final_score,
                "influenced_transitions": ContextDiscoveryService._get_influenced_transitions(samples),
            })

        results.sort(key=lambda x: x["final_score"], reverse=True)

        return {
            "datasource_id": datasource_id,
            "candidate_count": len(candidates),
            "results": results,
            "recommended_contexts": [r["column"] for r in results[:3]],
        }
    
    @staticmethod
    def _get_influenced_transitions(samples: list[dict], top_k: int = 5):
        transition_counts = Counter(s["transition"] for s in samples)
        source_counts = Counter(s["source"] for s in samples)

        contextual_transition_counts = Counter(
            (s["source"], s["target"], s["context_value"]) for s in samples
        )

        contextual_source_counts = Counter(
            (s["source"], s["context_value"]) for s in samples
        )

        results = []

        for (source, target, context_value), contextual_count in contextual_transition_counts.items():
            contextual_outgoing = contextual_source_counts[(source, context_value)]
            global_count = transition_counts[f"{source} -> {target}"]
            global_outgoing = source_counts[source]

            if contextual_outgoing < 3:
                continue

            p_global = global_count / global_outgoing
            p_context = contextual_count / contextual_outgoing

            if p_global == 0 or p_context == 0:
                continue

            e_ext = -math.log(p_context / p_global)

            if e_ext < -0.2:
                effect = "increases"
            elif e_ext > 0.2:
                effect = "decreases"
            else:
                effect = "neutral"

            if effect == "neutral":
                continue

            results.append({
                "transition": f"{source} -> {target}",
                "context_value": str(context_value),
                "p_global": p_global,
                "p_context": p_context,
                "e_ext": e_ext,
                "effect": effect,
                "support": contextual_outgoing,
            })

        results.sort(key=lambda x: abs(x["e_ext"]), reverse=True)

        return results[:top_k]