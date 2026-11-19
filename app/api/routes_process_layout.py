from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from schemas.process_layout_schema import ProcessLayoutSave
from services.process_layout_service import ProcessLayoutService

router = APIRouter(prefix="/process-layouts", tags=["Process Layouts"])


@router.get("/{datasource_id}")
def get_layout(datasource_id: int, db: Session = Depends(get_db)):
    try:
        return ProcessLayoutService.get_layout(db, datasource_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print("GET LAYOUT ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{datasource_id}")
def save_layout(
    datasource_id: int,
    payload: ProcessLayoutSave,
    db: Session = Depends(get_db),
):
    try:
        return ProcessLayoutService.save_layout(db, datasource_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print("SAVE LAYOUT ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))