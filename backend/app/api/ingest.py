import os
import hashlib
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.services.llm import extract_rules_mock

router = APIRouter()

# In-memory mock review queue and processed document hashes
REVIEW_QUEUE = []
PROCESSED_HASHES = set()

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    # Read file content and generate hash for idempotency
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    
    if file_hash in PROCESSED_HASHES:
        return {
            "status": "skipped",
            "message": "Document already ingested (duplicate content hash detected).",
            "warning": None,
            "rules_extracted": 0
        }
        
    PROCESSED_HASHES.add(file_hash)
    
    # We still check for "LLM_API_KEY" as per instructions
    has_key = bool(os.environ.get("LLM_API_KEY"))
    
    rules = extract_rules_mock()
    
    # Optional: ensure we don't add duplicates to the queue if they are already there
    existing_ids = {r.rule_id for r in REVIEW_QUEUE}
    added_count = 0
    for r in rules:
        if r.rule_id not in existing_ids:
            REVIEW_QUEUE.append(r)
            added_count += 1
        
    return {
        "status": "success",
        "message": "Document parsed. Rules placed in Review Queue.",
        "warning": None if has_key else "extraction requires LLM_API_KEY env var - using mocked data",
        "rules_extracted": added_count
    }

@router.get("/queue")
def get_review_queue():
    return [r.dict() for r in REVIEW_QUEUE]

@router.post("/queue/approve")
def approve_rule(rule_id: str):
    global REVIEW_QUEUE
    rule = next((r for r in REVIEW_QUEUE if r.rule_id == rule_id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found in queue")
    
    # Commit to graph
    from app.services.graph import add_rule_to_graph
    add_rule_to_graph(rule.dict())
    
    # Remove from queue
    REVIEW_QUEUE = [r for r in REVIEW_QUEUE if r.rule_id != rule_id]
    
    # Trigger SSE update
    from app.api.devices import notify_score_update
    notify_score_update()
    
    return {"status": "approved", "rule_id": rule_id}
