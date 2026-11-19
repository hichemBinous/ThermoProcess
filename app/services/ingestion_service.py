import csv
import io
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session

from models.datasource import DataSource
from models.events import Event


class IngestionService:
    ALLOWED_EXTENSIONS = {".csv"}

    @staticmethod
    def _validate_file(filename: str) -> None:
        if not filename:
            raise HTTPException(status_code=400, detail="Missing file name.")

        _, ext = os.path.splitext(filename.lower())
        if ext not in IngestionService.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. Only CSV is allowed for now."
            )

    @staticmethod
    async def _read_csv_rows(file: UploadFile) -> List[Dict[str, Any]]:
        content = await file.read()

        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        try:
            decoded = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Unable to decode CSV file. Please use UTF-8 encoding."
            )

        stream = io.StringIO(decoded)
        reader = csv.DictReader(stream)

        if not reader.fieldnames:
            raise HTTPException(status_code=400, detail="CSV file has no header row.")

        rows = []
        for row in reader:
            cleaned_row = {
                (k.strip() if isinstance(k, str) else k): (
                    v.strip() if isinstance(v, str) else v
                )
                for k, v in row.items()
            }
            rows.append(cleaned_row)

        if not rows:
            raise HTTPException(status_code=400, detail="CSV file contains no data rows.")

        return rows

    @staticmethod
    def create_datasource(
        db: Session,
        domain_id: int,
        name: str,
        source_type: str = "csv",
        original_filename: Optional[str] = None,
    ) -> DataSource:
        datasource = DataSource(
            domain_id=domain_id,
            name=name,
            source_type=source_type,
            original_filename=original_filename,
            created_at=datetime.utcnow(),
        )
        db.add(datasource)
        db.commit()
        db.refresh(datasource)
        return datasource

    @staticmethod
    def store_events(
        db: Session,
        datasource_id: int,
        rows: List[Dict[str, Any]],
    ) -> int:
        event_objects = [
            Event(
                datasource_id=datasource_id,
                row_data=row,
                created_at=datetime.utcnow(),
            )
            for row in rows
        ]

        db.add_all(event_objects)
        db.commit()
        return len(event_objects)

    @staticmethod
    async def ingest_csv(
        db: Session,
        file: UploadFile,
        domain_id: int,
        datasource_name: Optional[str] = None,
    ):
        IngestionService._validate_file(file.filename)
        rows = await IngestionService._read_csv_rows(file)

        datasource = IngestionService.create_datasource(
            db=db,
            domain_id=domain_id,
            name=datasource_name or file.filename,
            source_type="csv",
            original_filename=file.filename,
        )

        inserted_count = IngestionService.store_events(
            db=db,
            datasource_id=datasource.id,
            rows=rows,
        )

        return {
            "message": "CSV ingested successfully",
            "datasource_id": datasource.id,
            "rows_inserted": inserted_count,
            "columns_detected": list(rows[0].keys()) if rows else [],
        }