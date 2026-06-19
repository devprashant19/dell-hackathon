import json
import os
from pydantic import BaseModel, Field
from typing import List, Optional

class ComponentDef(BaseModel):
    type: str
    name: str
class RuleDef(BaseModel):
    rule_id: str
    source_doc: str
    source_page: int
    rule_type: str
    confidence: float
    subject_component: dict
    depends_on: List[dict] = []
    conflicts_with: List[dict] = []

def extract_rules_mock() -> List[RuleDef]:
    file_path = os.path.join(os.path.dirname(__file__), "../../../../files/extracted_rules_reference.json")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            raw_rules = data.get("rules", [])
            
            # Deduplicate by (subject, conflict) signature
            merged_rules = {}
            for r in raw_rules:
                subj = r["subject_component"]
                subj_sig = f"{subj['type']}::{subj['name']}::{subj['version_constraint']}"
                
                # We'll create a signature based on subject and all its dependencies/conflicts
                # For simplicity, just stringify the depends_on and conflicts_with
                deps_sig = json.dumps(r.get("depends_on", []), sort_keys=True)
                confs_sig = json.dumps(r.get("conflicts_with", []), sort_keys=True)
                
                sig = f"{subj_sig} | {deps_sig} | {confs_sig}"
                
                if sig in merged_rules:
                    # Append source document to existing rule to merge provenance
                    existing = merged_rules[sig]
                    existing["source_doc"] = f"{existing['source_doc']}, {r['source_doc']}"
                else:
                    merged_rules[sig] = r
                    
            return [RuleDef(**r) for r in merged_rules.values()]
    except Exception as e:
        print(f"Error loading mock rules: {e}")
        return []
