import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.services.scoring import get_all_device_scores, score_device
from app.services.explain import get_explanations_for_device
from app.services.remediate import suggest_remediation

router = APIRouter()

# Global subscribers for SSE events
SCORE_SUBSCRIBERS = []

def notify_score_update():
    """Triggered by ingest.py when graph changes."""
    for q in SCORE_SUBSCRIBERS:
        q.put_nowait("update")

@router.get("/stream")
async def stream_device_updates():
    async def event_generator():
        queue = asyncio.Queue()
        SCORE_SUBSCRIBERS.append(queue)
        try:
            while True:
                data = await queue.get()
                yield f"data: {data}\n\n"
        finally:
            SCORE_SUBSCRIBERS.remove(queue)
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/")
def list_devices():
    return get_all_device_scores()

@router.get("/{device_id}")
def get_device_detail(device_id: str):
    result = score_device(device_id)
    if not result:
        raise HTTPException(status_code=404, detail="Device not found")
        
    violations_with_context = []
    for v in result["violations"]:
        v_copy = v.copy()
        v_copy["explanation"] = get_explanations_for_device([v])[0]
        v_copy["remediations"] = suggest_remediation(v, device_id)
        violations_with_context.append(v_copy)
        
    result["violations"] = violations_with_context
    return result
