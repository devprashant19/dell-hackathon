import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CompatIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "neo4j_uri": os.environ.get("NEO4J_URI", "Not Set")}

from app.api.ingest import router as ingest_router
from app.api.devices import router as devices_router
from app.api.graph import router as graph_router

app.include_router(ingest_router, prefix="/api/ingest", tags=["Ingest"])
app.include_router(devices_router, prefix="/api/devices", tags=["Devices"])
app.include_router(graph_router, prefix="/api/graph", tags=["Graph"])
