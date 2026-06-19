import sys
import os
import json
import time
from packaging.specifiers import SpecifierSet
from packaging.version import Version, InvalidVersion

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from app.services.graph import init_schema, get_db
from app.services.llm import extract_rules_mock

def load_devices():
    seed_data_path = os.path.join(os.path.dirname(__file__), "../../../seed_data/device_inventory.json")
    try:
        with open(seed_data_path, "r", encoding="utf-8") as f:
            return json.load(f)["devices"]
    except Exception as e:
        print(f"Error loading devices: {e}")
        return []

def safe_version(v_str):
    # Fallback to handle non-standard versions like "25H2" or "24H2" by stripping letters or just returning a dummy if unparseable
    try:
        return Version(v_str)
    except InvalidVersion:
        # Strip letters for windows versions if needed, but in our JSON the OS build is purely numeric e.g. "27000.0"
        return Version("0.0.0")

def matches_constraint(version_str, constraint_str):
    if constraint_str == "*": return True
    if not constraint_str: return True
    try:
        # Replace '==' with '==' for specifiers, but rule JSON uses '==' or '>='
        spec = SpecifierSet(constraint_str)
        return safe_version(version_str) in spec
    except Exception as e:
        print(f"Constraint parse error: {constraint_str} for {version_str}")
        return False

def init_db():
    print("Initializing Neo4j schema...")
    for i in range(10):
        try:
            init_schema()
            break
        except Exception as e:
            print("Waiting for Neo4j...")
            time.sleep(5)
    
    print("Loading device inventory...")
    devices = load_devices()
    concrete_components = set()
    
    with get_db() as session:
        for d in devices:
            session.run("MERGE (dev:Device {device_id: $device_id})", device_id=d["device_id"])
            
            # Parse the dictionary
            comps = d.get("components", {})
            parsed_comps = []
            
            # Map dictionary schema to Component types
            if "bios" in comps:
                parsed_comps.append({"type": "bios", "name": f"{comps['bios'].get('vendor', 'Dell')} BIOS", "version": comps["bios"].get("version")})
            if "tpm_firmware" in comps:
                parsed_comps.append({"type": "tpm_firmware", "name": "TPM Firmware", "version": comps["tpm_firmware"].get("version")})
            if "nic_firmware" in comps:
                parsed_comps.append({"type": "nic_firmware", "name": comps["nic_firmware"].get("name"), "version": comps["nic_firmware"].get("version")})
            if "chipset_driver" in comps:
                parsed_comps.append({"type": "driver", "name": comps["chipset_driver"].get("name"), "version": comps["chipset_driver"].get("version")})
            if "operating_system" in comps:
                parsed_comps.append({"type": "os", "name": comps["operating_system"].get("name"), "version": comps["operating_system"].get("build")})
            if "endpoint_agents" in comps:
                agents = comps["endpoint_agents"]
                if "crowdstrike_falcon" in agents:
                    parsed_comps.append({"type": "agent", "name": "CrowdStrike Falcon Sensor", "version": agents["crowdstrike_falcon"]})
                if "tanium_client" in agents:
                    parsed_comps.append({"type": "agent", "name": "Tanium Client", "version": agents["tanium_client"]})

            for comp in parsed_comps:
                comp_key = (comp["type"], comp["name"], comp["version"])
                concrete_components.add(comp_key)
                session.run(
                    """
                    MERGE (c:Component {type: $type, name: $name, version: $version})
                    WITH c
                    MATCH (dev:Device {device_id: $device_id})
                    MERGE (dev)-[:RUNS_ON]->(c)
                    """,
                    type=comp["type"], name=comp["name"], version=comp["version"], device_id=d["device_id"]
                )

    print("Loading rules and evaluating constraints...")
    rules = extract_rules_mock()
    with get_db() as session:
        for rule_obj in rules:
            rule = rule_obj.dict()
            session.run(
                """
                MERGE (r:Rule {rule_id: $rule_id})
                SET r.rule_type = $rule_type, r.source_doc = $source_doc, r.confidence = $confidence, r.degrades_silently_if_unmet = $degrades_silently_if_unmet
                """, **rule
            )
            
            # Find matching subject components
            subj = rule["subject_component"]
            for comp in concrete_components:
                # Require name match for agents to prevent cross-pollination
                name_match = True
                if comp[0] == "agent":
                    name_match = comp[1] == subj.get("name")
                    
                if comp[0] == subj["type"] and name_match and matches_constraint(comp[2], subj["version_constraint"]):
                    session.run(
                        "MATCH (c:Component {type: $t, name: $n, version: $v}), (r:Rule {rule_id: $rid}) MERGE (c)-[:SUBJECT_OF]->(r)",
                        t=comp[0], n=comp[1], v=comp[2], rid=rule["rule_id"]
                    )
            
            # Requires
            for dep in (rule.get("depends_on") or []):
                for comp in concrete_components:
                    name_match = True
                    if comp[0] == "agent":
                        name_match = comp[1] == dep.get("name")
                        
                    if comp[0] == dep["type"] and name_match and matches_constraint(comp[2], dep["version_constraint"]):
                        session.run(
                            "MATCH (c:Component {type: $t, name: $n, version: $v}), (r:Rule {rule_id: $rid}) MERGE (r)-[:REQUIRES]->(c)",
                            t=comp[0], n=comp[1], v=comp[2], rid=rule["rule_id"]
                        )
            
            # Conflicts
            for conf in (rule.get("conflicts_with") or []):
                for comp in concrete_components:
                    name_match = True
                    if comp[0] == "agent":
                        name_match = comp[1] == conf.get("name")
                        
                    if comp[0] == conf["type"] and name_match and matches_constraint(comp[2], conf["version_constraint"]):
                        session.run(
                            "MATCH (c:Component {type: $t, name: $n, version: $v}), (r:Rule {rule_id: $rid}) MERGE (r)-[:CONFLICTS_WITH]->(c)",
                            t=comp[0], n=comp[1], v=comp[2], rid=rule["rule_id"]
                        )

if __name__ == "__main__":
    init_db()
    print("Database initialization complete.")
