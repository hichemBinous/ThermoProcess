import json
from sqlalchemy.orm import Session

from models.datasource import DataSource
from models.process_layout import ProcessLayout
from schemas.process_layout_schema import ProcessLayoutSave


class ProcessLayoutService:

    @staticmethod
    def get_layout(db: Session, datasource_id: int):
        datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
        if not datasource:
            raise ValueError("Datasource not found")

        layout = (
            db.query(ProcessLayout)
            .filter(ProcessLayout.datasource_id == datasource_id)
            .first()
        )

        if not layout:
            return {"datasource_id": datasource_id, "layout": {}}

        return {
            "datasource_id": datasource_id,
            "layout": json.loads(layout.layout_json),
        }

    @staticmethod
    def save_layout(db: Session, datasource_id: int, payload: ProcessLayoutSave):
        datasource = db.query(DataSource).filter(DataSource.id == datasource_id).first()
        if not datasource:
            raise ValueError("Datasource not found")

        existing = (
            db.query(ProcessLayout)
            .filter(ProcessLayout.datasource_id == datasource_id)
            .first()
        )

        layout_json = json.dumps(
            {node_id: pos.model_dump() for node_id, pos in payload.layout.items()}
        )

        if existing:
            existing.layout_json = layout_json
            db.commit()
            db.refresh(existing)
            return {"message": "Layout updated successfully", "datasource_id": datasource_id}

        layout = ProcessLayout(
            datasource_id=datasource_id,
            layout_json=layout_json,
        )

        db.add(layout)
        db.commit()
        db.refresh(layout)

        return {"message": "Layout saved successfully", "datasource_id": datasource_id}