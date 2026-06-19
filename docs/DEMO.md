# CompatIQ Demo Script

## Setup
1. Run `docker-compose up -d --build` in the `e:\dell\compatiq` directory.
2. Run `docker-compose exec backend python scripts/init_db.py` to initialize the Neo4j schema and pre-seed the device inventory.
3. Access the frontend at `http://localhost:5173`.

## Walkthrough

### 1. Document Ingestion & Mock LLM
- Navigate to the **Document Ingestion** tab.
- Notice the warning: "Warning: LLM Mock Mode - extraction requires LLM_API_KEY env var". This fulfills the requirement of building a thin extraction stub while being honest about the mocked LLM.
- Click to upload any PDF. The system will "extract" rules (using the pre-seeded `extracted_rules_reference.json`) and place them in the Review Queue.

### 2. Rule Review Queue
- Navigate to the **Review Queue** tab.
- You will see the newly extracted rules. Observe the confidence scores and ambiguous flags (e.g., RULE-008).
- Click **Approve** on the rules to commit them to the Neo4j Knowledge Graph.

### 3. Fleet Compliance & Device Scoring
- Navigate to the **Fleet Overview** tab.
- The system will continuously query the backend. After rules are approved, the compliance scores of the fleet will recalculate.
- Look for non-compliant devices (e.g. `DV-0046`, `DV-0042`).

### 4. Transitive Conflict Resolution (DV-0042)
- Click **View Details** for `DV-0042`.
- You will see a detailed breakdown. Because of the multi-hop conflict (CrowdStrike Falcon 7.18 -> Windows 11 24H2 -> BIOS >= 2.16.0 -> Conflicts with NIC Firmware < 23.0), the system accurately penalizes the device.
- Review the **Root Cause Explanation** which explicitly cites the source documents and rules.
- Review the **Suggested Remediation (Simulated)** which recommends upgrading the NIC Firmware to resolve the multi-hop conflict.

### 5. Knowledge Graph
- Navigate to the **Knowledge Graph** tab.
- Interact with the `react-force-graph` visualization. Components are blue, Devices are green, and Rules are purple.
- Click on nodes to center and zoom in on their relationships.
