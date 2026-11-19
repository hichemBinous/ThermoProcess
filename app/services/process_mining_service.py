import json
import pandas as pd
from sqlalchemy.orm import Session

from pm4py.objects.conversion.log import converter as log_converter
from pm4py.objects.log.util import dataframe_utils

from models.raw_event import RawEvent
from pm4py.statistics.traces.generic.log import case_statistics
from pm4py.statistics.attributes.log import get as attributes_get
from pm4py.algo.discovery.dfg import algorithm as dfg_discovery


class ProcessMiningService:

    @staticmethod
    def get_raw_events_dataframe(db: Session, datasource_id: int) -> pd.DataFrame:
        raw_events = (
            db.query(RawEvent)
            .filter(RawEvent.datasource_id == datasource_id)
            .all()
        )

        if not raw_events:
            raise ValueError("No standardized raw_events found for this datasource")

        rows = []
        for event in raw_events:
            context_data = {}
            if event.context_data:
                try:
                    context_data = json.loads(event.context_data)
                except Exception:
                    context_data = {}

            row = {
                "case_id": event.case_id,
                "activity": event.activity,
                "timestamp": event.timestamp,
                "resource": event.resource,
            }

            # ajoute les colonnes de contexte au dataframe
            if isinstance(context_data, dict):
                row.update(context_data)

            rows.append(row)

        df = pd.DataFrame(rows)

        if df.empty:
            raise ValueError("Generated DataFrame is empty")

        return df

    @staticmethod
    def prepare_pm4py_dataframe(df: pd.DataFrame) -> pd.DataFrame:
        # Renommage au format attendu par PM4Py
        rename_map = {
            "case_id": "case:concept:name",
            "activity": "concept:name",
            "timestamp": "time:timestamp",
            "resource": "org:resource",
        }

        df = df.rename(columns=rename_map)

        # conversion timestamp
        df["time:timestamp"] = pd.to_datetime(df["time:timestamp"],utc=True, errors="coerce")

        # supprimer les lignes invalides pour PM4Py
        df = df.dropna(subset=["case:concept:name", "concept:name", "time:timestamp"])

        # conversion utilitaire PM4Py
        df = dataframe_utils.convert_timestamp_columns_in_df(df)

        # tri important
        df = df.sort_values(by=["case:concept:name", "time:timestamp"])

        return df

    @staticmethod
    def dataframe_to_event_log(df: pd.DataFrame):
        parameters = {
            log_converter.Variants.TO_EVENT_LOG.value.Parameters.CASE_ID_KEY: "case:concept:name"
        }

        event_log = log_converter.apply(
            df,
            parameters=parameters,
            variant=log_converter.Variants.TO_EVENT_LOG
        )

        return event_log

    @staticmethod
    def load_event_log(db: Session, datasource_id: int):
        df = ProcessMiningService.get_raw_events_dataframe(db, datasource_id)
        pm_df = ProcessMiningService.prepare_pm4py_dataframe(df)
        event_log = ProcessMiningService.dataframe_to_event_log(pm_df)

        return {
            "dataframe": pm_df,
            "event_log": event_log
        }
    
    @staticmethod
    def get_basic_statistics(db: Session, datasource_id: int):
        result = ProcessMiningService.load_event_log(db, datasource_id)
        event_log = result["event_log"]
        df = result["dataframe"]

        variants_count = case_statistics.get_variant_statistics(event_log)
        activities = attributes_get.get_attribute_values(event_log, "concept:name")

        return {
            "num_events": len(df),
            "num_cases": df["case:concept:name"].nunique(),
            "num_activities": df["concept:name"].nunique(),
            "activities": activities,
            "top_variants": variants_count[:10]
        }
    
    
    @staticmethod
    def discover_dfg(db: Session, datasource_id: int):
        result = ProcessMiningService.load_event_log(db, datasource_id)
        event_log = result["event_log"]

        dfg = dfg_discovery.apply(event_log)

        formatted_dfg = [
            {
                "from": source,
                "to": target,
                "count": count
            }
            for (source, target), count in dfg.items()
        ]

        return {
            "edges": formatted_dfg
        }