from fastapi import APIRouter
from app.services.graph import get_db

router = APIRouter()

@router.get("/")
def get_graph_data():
    with get_db() as session:
        # Fetch nodes
        nodes = []
        links = []
        
        # We need distinct nodes: Components, Devices, Rules
        res = session.run("MATCH (n) RETURN id(n) AS id, labels(n) AS labels, properties(n) AS props")
        node_map = {}
        for record in res:
            node_id = record["id"]
            labels = record["labels"]
            props = dict(record["props"])
            
            node_obj = {
                "id": str(node_id),
                "label": labels[0] if labels else "Unknown",
            }
            
            if "Component" in labels:
                node_obj["name"] = f"{props.get('type')} {props.get('name')} {props.get('version_constraint')}"
                node_obj["group"] = 1
            elif "Device" in labels:
                node_obj["name"] = props.get("device_id")
                node_obj["group"] = 2
            elif "Rule" in labels:
                node_obj["name"] = props.get("rule_id")
                node_obj["group"] = 3
            else:
                node_obj["name"] = str(props)
                node_obj["group"] = 0
                
            nodes.append(node_obj)
            node_map[node_id] = node_obj
            
        # Fetch relationships
        res = session.run("MATCH (n)-[r]->(m) RETURN id(n) AS source, id(m) AS target, type(r) AS type")
        for record in res:
            links.append({
                "source": str(record["source"]),
                "target": str(record["target"]),
                "label": record["type"]
            })
            
        return {"nodes": nodes, "links": links}
