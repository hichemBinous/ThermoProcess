from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from services.context_discovery_service import ContextDiscoveryService

router = APIRouter(prefix="/context-discovery", tags=["Context Discovery"])


@router.get("/{datasource_id}")
def analyze_contexts(datasource_id: int, db: Session = Depends(get_db)):
    try:
        return ContextDiscoveryService.analyze_candidate_contexts(db, datasource_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print("CONTEXT DISCOVERY ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))