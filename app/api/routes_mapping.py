from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.mapping_schema import EventMappingCreate, EventMappingResponse
from services.mapping_service import MappingService
from models.raw_event import RawEvent
router = APIRouter(prefix="/mapping", tags=["Mapping"])


@router.get("/{datasource_id}/columns")
def get_columns(datasource_id: int, db: Session = Depends(get_db)):
    try:
        columns = MappingService.get_available_columns(db, datasource_id)
        return {"columns": columns}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{datasource_id}", response_model=EventMappingResponse)
def save_mapping(datasource_id: int, payload: EventMappingCreate, db: Session = Depends(get_db)):
    try:
        return MappingService.save_mapping(db, datasource_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{datasource_id}", response_model=EventMappingResponse)
def get_mapping(datasource_id: int, db: Session = Depends(get_db)):
    try:
        return MappingService.get_mapping(db, datasource_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{datasource_id}/normalized")
def get_normalized_events(datasource_id: int, db: Session = Depends(get_db)):
    try:
        return {"events": MappingService.get_normalized_events(db, datasource_id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    


@router.post("/{datasource_id}/apply")
def apply_mapping(datasource_id: int, db: Session = Depends(get_db)):
    try:
        return MappingService.apply_mapping(db, datasource_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("APPLY MAPPING ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{datasource_id}/status")
def get_mapping_status(datasource_id: int, db: Session = Depends(get_db)):
    try:
        mapping = MappingService.get_mapping(db, datasource_id)

        raw_events_count = (
            db.query(RawEvent)
            .filter(RawEvent.datasource_id == datasource_id)
            .count()
        )

        return {
            "datasource_id": datasource_id,
            "saved_mapping": {
                "case_id_column": mapping.case_id_column,
                "activity_column": mapping.activity_column,
                "timestamp_column": mapping.timestamp_column,
                "resource_column": mapping.resource_column,
                "context_columns": mapping.context_columns,
            },
            "applied": bool(mapping.is_applied),
            "last_applied_at": mapping.last_applied_at.isoformat() if mapping.last_applied_at else None,
            "raw_events_count": raw_events_count,
            "mapping_for_analysis": bool(mapping.is_applied and raw_events_count > 0)
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print("GET MAPPING STATUS ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))