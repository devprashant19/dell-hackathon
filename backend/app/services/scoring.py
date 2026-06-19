from typing import List, Dict, Any
from app.services.graph import get_db

def score_device(device_id: str) -> Dict[str, Any]:
    score = 100
    violations = []
    
    with get_db() as session:
        # 1. Check missing REQUIRES
        req_query = """
        MATCH (d:Device {device_id: $device_id})-[:RUNS_ON]->(c1:Component)<-[:SUBJECT_OF]-(r:Rule)-[:REQUIRES]->(req_c:Component)
        WHERE NOT (d)-[:RUNS_ON]->(req_c)
        RETURN c1.name AS subject, req_c.name AS missing_requirement, req_c.version AS expected_version, r
        """
        req_res = session.run(req_query, device_id=device_id)
        for record in req_res:
            rule = dict(record["r"])
            violations.append({
                "type": "MISSING_REQUIREMENT",
                "subject": record["subject"],
                "missing": record["missing_requirement"],
                "expected": record["expected_version"],
                "rule_id": rule.get("rule_id"),
                "source_doc": rule.get("source_doc"),
                "penalty": 30,
                "explanation": f"Missing Requirement: {record['subject']} requires {record['missing_requirement']}. [Source: {rule.get('source_doc')}, page {rule.get('source_page', 'N/A')} - Rule {rule.get('rule_id')}]"
            })
            score -= 30

        # 2. Check 1-hop, 2-hop, 3-hop CONFLICTS
        # 1-hop
        conf1 = session.run("""
        MATCH (d:Device {device_id: $device_id})-[:RUNS_ON]->(c1:Component)<-[:SUBJECT_OF]-(r1:Rule)-[:CONFLICTS_WITH]->(c2:Component)<-[:RUNS_ON]-(d)
        RETURN c1, r1, c2
        """, device_id=device_id)
        for record in conf1:
            rule = dict(record["r1"])
            c1 = dict(record["c1"])
            c2 = dict(record["c2"])
            violations.append({
                "type": "CONFLICT",
                "subject": c1["name"],
                "conflict": c2["name"],
                "conflict_version": c2["version"],
                "rule_id": rule.get("rule_id"),
                "source_doc": rule.get("source_doc"),
                "penalty": 40,
                "explanation": f"Direct Conflict: {c1['name']} conflicts with {c2['name']} v{c2['version']}. [Source: {rule.get('source_doc')}, page {rule.get('source_page', 'N/A')} - Rule {rule.get('rule_id')}]"
            })
            score -= 40
            
        # 2-hop
        conf2 = session.run("""
        MATCH (d:Device {device_id: $device_id})-[:RUNS_ON]->(c1:Component)<-[:SUBJECT_OF]-(r1:Rule)-[:REQUIRES]->(c2:Component)<-[:SUBJECT_OF]-(r2:Rule)-[:CONFLICTS_WITH]->(c3:Component)<-[:RUNS_ON]-(d)
        WHERE (d)-[:RUNS_ON]->(c2)
        RETURN c1, r1, c2, r2, c3
        """, device_id=device_id)
        for record in conf2:
            c1, r1, c2, r2, c3 = [dict(record[k]) for k in ["c1", "r1", "c2", "r2", "c3"]]
            violations.append({
                "type": "TRANSITIVE_CONFLICT",
                "subject": c1["name"],
                "conflict": c3["name"],
                "conflict_version": c3["version"],
                "rule_id": r2.get("rule_id"),
                "source_doc": r2.get("source_doc"),
                "penalty": 40,
                "explanation": f"Transitive Conflict (2-hop): {c1['name']} requires {c2['name']} [Source: {r1.get('source_doc')}, page {r1.get('source_page', 'N/A')} - Rule {r1.get('rule_id')}], which conflicts with {c3['name']} v{c3['version']} [Source: {r2.get('source_doc')}, page {r2.get('source_page', 'N/A')} - Rule {r2.get('rule_id')}]."
            })
            score -= 40

        # 3-hop
        conf3 = session.run("""
        MATCH (d:Device {device_id: $device_id})-[:RUNS_ON]->(c1:Component)<-[:SUBJECT_OF]-(r1:Rule)-[:REQUIRES]->(c2:Component)<-[:SUBJECT_OF]-(r2:Rule)-[:REQUIRES]->(c3:Component)<-[:SUBJECT_OF]-(r3:Rule)-[:CONFLICTS_WITH]->(c4:Component)<-[:RUNS_ON]-(d)
        WHERE (d)-[:RUNS_ON]->(c2) AND (d)-[:RUNS_ON]->(c3)
        RETURN c1, r1, c2, r2, c3, r3, c4
        """, device_id=device_id)
        for record in conf3:
            c1, r1, c2, r2, c3, r3, c4 = [dict(record[k]) for k in ["c1", "r1", "c2", "r2", "c3", "r3", "c4"]]
            violations.append({
                "type": "TRANSITIVE_CONFLICT",
                "subject": c1["name"],
                "conflict": c4["name"],
                "conflict_version": c4["version"],
                "rule_id": r3.get("rule_id"),
                "source_doc": r3.get("source_doc"),
                "penalty": 40,
                "explanation": f"Transitive Conflict (3-hop): {c1['name']} requires {c2['name']} [Source: {r1.get('source_doc')}, page {r1.get('source_page', 'N/A')} - Rule {r1.get('rule_id')}], which requires {c3['name']} [Source: {r2.get('source_doc')}, page {r2.get('source_page', 'N/A')} - Rule {r2.get('rule_id')}], which conflicts with {c4['name']} v{c4['version']} [Source: {r3.get('source_doc')}, page {r3.get('source_page', 'N/A')} - Rule {r3.get('rule_id')}]."
            })
            score -= 40
            
        score = max(0, score)
        
    return {
        "device_id": device_id,
        "score": score,
        "violations": violations
    }

def get_all_device_scores() -> List[Dict[str, Any]]:
    with get_db() as session:
        res = session.run("MATCH (d:Device) RETURN d.device_id AS device_id")
        device_ids = [r["device_id"] for r in res]
        
    return [score_device(did) for did in device_ids]
