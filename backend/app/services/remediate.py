from typing import List, Dict, Any
from app.services.graph import get_db

def suggest_remediation(violation: dict, device_id: str) -> List[Dict[str, Any]]:
    remediations = []
    v_type = violation.get("type")
    
    with get_db() as session:
        if v_type == "CONFLICT" or v_type == "TRANSITIVE_CONFLICT":
            # Action: Upgrade or Downgrade the conflicting component
            target_comp = violation.get("conflict")
            target_version = violation.get("conflict_version")
            
            # Simulate removing the conflict component
            # Would the score improve? Yes, by the penalty amount.
            # We suggest upgrading to a version that does not conflict.
            remediations.append({
                "action": "UPGRADE_OR_DOWNGRADE",
                "component": target_comp,
                "target_version": "Version that does not match the conflict constraint",
                "impact": "Low - Resolves the conflict path directly.",
                "simulated_score_after": f"+{violation.get('penalty', 40)} points"
            })
            
        elif v_type == "MISSING_REQUIREMENT" or v_type == "DEGRADED_PERFORMANCE":
            target_comp = violation.get("missing")
            expected_ver = violation.get("expected")
            
            # Simulate: if we install target_comp matching expected_ver, does it conflict with existing?
            # Find all rules that target_comp might violate with existing components
            sim_query = """
            MATCH (d:Device {device_id: $device_id})-[:RUNS_ON]->(existing:Component)
            MATCH (r:Rule)-[:CONFLICTS_WITH]->(existing)
            MATCH (c_target:Component {name: $target_comp})
            WHERE (c_target)-[:SUBJECT_OF]->(r)
            RETURN existing.name AS conflict_with, r.rule_id AS rule_id
            """
            res = session.run(sim_query, device_id=device_id, target_comp=target_comp)
            conflicts = [record["conflict_with"] for record in res]
            
            if conflicts:
                impact = f"High Risk - Installing this will trigger new conflicts with: {', '.join(conflicts)}."
                sim_score = "+0 points (New conflicts negate the fix)"
            else:
                impact = "Medium - No secondary conflicts detected in simulation."
                sim_score = f"+{violation.get('penalty', 30)} points"
                
            remediations.append({
                "action": "INSTALL_OR_UPGRADE",
                "component": target_comp,
                "target_version": expected_ver,
                "impact": impact,
                "simulated_score_after": sim_score
            })
            
    return remediations
