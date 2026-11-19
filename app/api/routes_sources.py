from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
import sqlalchemy.orm
import shutil
import os
import pandas as pd
from models.raw_event import RawEvent
from models.eventMapping import EventMapping
from core.database import get_db
from models.datasource import DataSource
from services.ingestion_service import IngestionService
router = APIRouter(prefix="/sources", tags=["Sources"])

@router.post("/")
def create_source(
    name: str,
    domain_id: int,
    type: str,
    db: sqlalchemy.orm.Session = Depends(get_db)
):
    source = DataSource(
        name=name,
        domain_id=domain_id,
        type=type
    )

    db.add(source)
    db.commit()
    db.refresh(source)#

    return source


@router.post("/upload")
async def upload_csv(
    domain_id: int = Form(...),
    datasource_name: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    return await IngestionService.ingest_csv(
        db=db,
        file=file,
        domain_id=domain_id,
        datasource_name=datasource_name,
    )

@router.get("")
def list_datasources(db: Session = Depends(get_db)):
    sources = db.query(DataSource).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "source_type": s.source_type,
            "domain_id": s.domain_id,
        }
        for s in sources
    ]





@router.post("/{source_id}/run")
def run_ingestion(source_id: int, db: sqlalchemy.orm.Session = Depends(get_db)):
    return IngestionService.ingest_csv(source_id, db)