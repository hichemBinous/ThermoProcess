import json
from sqlalchemy.orm import Session

from models.datasource import DataSource
from models.events import Event
from models.eventMapping import EventMapping
from models.raw_event import RawEvent
from schemas.mapping_schema import EventMappingCreate
from datetime import datetime

class MappingService:

    @staticmethod
    def get_available_columns(db: Session, datasource_id: int, sample_size: int = 50):
        datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
        if not datasource:
            raise ValueError("Datasource not found")

        events = (
            db.query(Event)
            .filter(Event.datasource_id == datasource_id)
            .limit(sample_size)
            .all()
        )

        if not events:
            return []

        columns = set()
        for event in events:
            if event.row_data and isinstance(event.row_data, dict):
                columns.update(event.row_data.keys())

        return sorted(list(columns))

    @staticmethod
    def get_mapping(db: Session, datasource_id: int):
        mapping = (
            db.query(EventMapping)
            .filter(EventMapping.datasource_id == datasource_id)
            .first()
        )
        if not mapping:
            raise ValueError("Mapping not found")
        return mapping

    @staticmethod
    def apply_mapping(db: Session, datasource_id: int, replace_existing: bool = True):
        datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
        if not datasource:
            raise ValueError("Datasource not found")

        mapping = MappingService.get_mapping(db, datasource_id)

        events = (
            db.query(Event)
            .filter(Event.datasource_id == datasource_id)
            .all()
        )

        if not events:
            raise ValueError("No raw events found for this datasource")

        if replace_existing:
            db.query(RawEvent).filter(RawEvent.datasource_id == datasource_id).delete()
            db.commit()

        inserted_count = 0
        skipped_count = 0

        for event in events:
            row = event.row_data or {}

            case_id = row.get(mapping.case_id_column)
            activity = row.get(mapping.activity_column)
            timestamp = row.get(mapping.timestamp_column)
            resource = row.get(mapping.resource_column) if mapping.resource_column else None

            context = {}
            if mapping.context_columns:
                context_columns = mapping.context_columns
                if isinstance(context_columns, str):
                    try:
                        context_columns = json.loads(context_columns)
                    except Exception:
                        context_columns = []

                for col in context_columns:
                    context[col] = row.get(col)

            if case_id is None or activity is None or timestamp is None:
                skipped_count += 1
                continue

            raw_event = RawEvent(
                datasource_id=datasource_id,
                case_id=str(case_id),
                activity=str(activity),
                timestamp=str(timestamp),
                resource=str(resource) if resource is not None else None,
                context_data=json.dumps(context)
            )

            db.add(raw_event)
            inserted_count += 1

        db.commit()
        mapping.is_applied = 1
        mapping.last_applied_at = datetime.utcnow()
        db.commit()
        return {
            "message": "Mapping applied successfully",
            "datasource_id": datasource_id,
            "inserted_count": inserted_count,
            "skipped_count": skipped_count
        }
    @staticmethod
    def save_mapping(db: Session, datasource_id: int, payload: EventMappingCreate):
        datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
        if not datasource:
            raise ValueError("Datasource not found")

        available_columns = MappingService.get_available_columns(db, datasource_id)

        required_columns = [
            payload.case_id_column,
            payload.activity_column,
            payload.timestamp_column,
        ]

        for col in required_columns:
            if col not in available_columns:
                raise ValueError(f"Column '{col}' does not exist in datasource")

        if payload.resource_column and payload.resource_column not in available_columns:
            raise ValueError(f"Column '{payload.resource_column}' does not exist in datasource")

        for col in payload.context_columns:
            if col not in available_columns:
                raise ValueError(f"Context column '{col}' does not exist in datasource")

        existing = (
            db.query(EventMapping)
            .filter(EventMapping.datasource_id == datasource_id)
            .first()
        )

        if existing:
            existing.case_id_column = payload.case_id_column
            existing.activity_column = payload.activity_column
            existing.timestamp_column = payload.timestamp_column
            existing.resource_column = payload.resource_column
            existing.context_columns = payload.context_columns
            existing.is_applied = 0
            existing.last_applied_at = None
            db.commit()
            db.refresh(existing)
            return existing

        mapping = EventMapping(
            datasource_id=datasource_id,
            case_id_column=payload.case_id_column,
            activity_column=payload.activity_column,
            timestamp_column=payload.timestamp_column,
            resource_column=payload.resource_column,
            context_columns=payload.context_columns,
            is_applied=0,
            last_applied_at=None
        )

        db.add(mapping)
        db.commit()
        db.refresh(mapping)
        return mapping