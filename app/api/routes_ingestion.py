from fastapi import APIRouter, UploadFile, File, Depends,Form
from sqlalchemy.orm import Session
import shutil
import os

from core.database import get_db
from services.ingestion_service import IngestionService

router = APIRouter()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


""" @router.post("/ingest/upload")
def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # sauvegarder le fichier
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ingestion
    result = ingest_csv(
        file_path=file_path,
        data_source_id=1,
        db=db
    )
        return result 
      """
@router.post("/ingest/upload")
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
