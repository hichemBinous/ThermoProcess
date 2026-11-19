from fastapi import FastAPI
from core.database import Base, engine
import models
from fastapi.middleware.cors import CORSMiddleware
from api.routes_ingestion import router as ingestion_router
from api.routes_domains import router as domains_router
from api.routes_sources import router as sources_router
from api.routes_mapping import router as mapping_router

from models.datasource import DataSource
from models.events import Event
from models.eventMapping import EventMapping
from models.raw_event import RawEvent
from api.routes_analysis import router as analysis_router
from models.process_layout import ProcessLayout
from api.routes_process_layout import router as process_layout_router
from api.routes_context_discovery import router as context_discovery_router



app = FastAPI()

# 🔥 CONFIG CORS SAFE
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(domains_router)
app.include_router(ingestion_router) 
app.include_router(sources_router)
app.include_router(mapping_router)
app.include_router(analysis_router)
app.include_router(process_layout_router)
app.include_router(context_discovery_router)
@app.get("/")
def root():
    return {"status": "ok"}
print(Base.metadata.tables.keys())

