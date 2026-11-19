from pydantic import BaseModel
from typing import Dict


class NodePosition(BaseModel):
    x: float
    y: float


class ProcessLayoutSave(BaseModel):
    layout: Dict[str, NodePosition]