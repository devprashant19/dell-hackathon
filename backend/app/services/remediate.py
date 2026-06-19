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
            script = f"# Auto-generated Remediation Script for {device_id}\n# Action: UPGRADE_OR_DOWNGRADE\n# Component: {target_comp}\n\nWrite-Host 'Resolving conflict for {target_comp} v{target_version}...'\n# Invoke-WebRequest -Uri 'https://internal.repo/{target_comp.replace(' ', '_')}_safe_version.exe' -OutFile 'C:\\temp\\installer.exe'\nWrite-Host 'Executing silent install...'\n# Start-Process -FilePath 'C:\\temp\\installer.exe' -ArgumentList '/S' -Wait -NoNewWindow\nWrite-Host 'Conflict resolved. Please verify telemetry.'\n"
            
            remediations.append({
                "action": "UPGRADE_OR_DOWNGRADE",
                "component": target_comp,
                "target_version": "Version that does not match the conflict constraint",
                "impact": "Low - Resolves the conflict path directly.",
                "simulated_score_after": f"+{violation.get('penalty', 40)} points",
                "script": script
            })
            
        elif v_type == "MISSING_REQUIREMENT" or v_type == "DEGRADED_PERFORMANCE":
            target_comp = violation.get("missing")
            expected_ver = violation.get("expected")
            
            # Simulate: if we install target_comp matching expected_ver, does it conflict with existing?
            # Find all rules that target_comp might violate with existing components
            sim_query = """
            MATCH (d:Device {device_id: $device_id})-[:RUNS_ON]->(existing:Component)
            MATCH (c_target:Component {name: $target_comp})
            OPTIONAL MATCH (c_target)-[:SUBJECT_OF]->(r1:Rule)-[:CONFLICTS_WITH]->(existing)
            OPTIONAL MATCH (existing)-[:SUBJECT_OF]->(r2:Rule)-[:CONFLICTS_WITH]->(c_target)
            WITH existing, r1, r2
            WHERE r1 IS NOT NULL OR r2 IS NOT NULL
            RETURN existing.name AS conflict_with
            """
            res = session.run(sim_query, device_id=device_id, target_comp=target_comp)
            conflicts = [record["conflict_with"] for record in res]
            
            if conflicts:
                impact = f"High Risk - Installing this will trigger new conflicts with: {', '.join(conflicts)}."
                sim_score = "+0 points (New conflicts negate the fix)"
            else:
                impact = "Medium - No secondary conflicts detected in simulation."
                sim_score = f"+{violation.get('penalty', 30)} points"
                
            script = f"# Auto-generated Remediation Script for {device_id}\n# Action: INSTALL_OR_UPGRADE\n# Component: {target_comp}\n# Version: {expected_ver}\n\nWrite-Host 'Downloading {target_comp} v{expected_ver}...'\n# Invoke-WebRequest -Uri 'https://internal.repo/{target_comp.replace(' ', '_')}_{expected_ver}.exe' -OutFile 'C:\\temp\\installer.exe'\nWrite-Host 'Executing silent install...'\n# Start-Process -FilePath 'C:\\temp\\installer.exe' -ArgumentList '/S' -Wait -NoNewWindow\nWrite-Host 'Installation complete. Please verify telemetry.'\n"
                
            remediations.append({
                "action": "INSTALL_OR_UPGRADE",
                "component": target_comp,
                "target_version": expected_ver,
                "impact": impact,
                "simulated_score_after": sim_score,
                "script": script
            })
            
    return remediations
