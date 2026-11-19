from pydantic import BaseModel
from typing import List, Optional


class EventMappingCreate(BaseModel):
    case_id_column: str
    activity_column: str
    timestamp_column: str
    resource_column: Optional[str] = None
    context_columns: List[str] = []


class EventMappingResponse(BaseModel):
    id: int
    datasource_id: int
    case_id_column: str
    activity_column: str
    timestamp_column: str
    resource_column: Optional[str] = None
    context_columns: List[str]

    class Config:
        from_attributes = True