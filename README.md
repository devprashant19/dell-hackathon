# CompatIQ - Compliance Engine

CompatIQ is a dynamic compatibility and configuration compliance engine that ingests vendor documents (PDFs, release notes), builds a Neo4j Knowledge Graph, and continuously scores a fleet of devices.

## Setup Instructions

1. Ensure Docker and Docker Compose are installed.
2. Navigate to the `compatiq` directory.
3. Run the following command to start the Neo4j, Backend (FastAPI), and Frontend (React/Vite) containers:
   ```bash
   docker-compose up -d --build
   ```
4. Initialize the database schema and seed data (devices + mocked rules):
   ```bash
   docker-compose exec backend python scripts/init_db.py
   ```
5. Access the frontend at `http://localhost:5173`.
6. Access the backend Swagger UI at `http://localhost:8000/docs`.

## Design Decisions

- **Graph Database**: Neo4j was selected because compatibility dependencies and conflicts are inherently a graph problem (e.g. A requires B, which requires C, which conflicts with D). Relational models struggle with these arbitrary-depth traversal queries.
- **Microservices Architecture**: The system is split into a React frontend and FastAPI backend. This allows horizontal scaling of the scoring engine independently of the ingestion pipeline.
- **LLM Integration**: The original design used Claude Sonnet 4.6 for PDF extraction. As per instructions, this prototype ships with a thin mock stub that reads `extracted_rules_reference.json` instead, but the architecture and UI still demonstrate the intended LLM flow (complete with Review Queue).

## Weighting Model for Compliance Scoring

Devices begin with a perfect score of `100`. The engine deducts points based on the severity of the violation:
- **`CONFLICT` (-40 points)**: A direct violation where a device has two components that a rule explicitly marks as conflicting. This is weighted heavily as it often indicates a critical risk of instability or failure.
- **`MISSING_REQUIREMENT` (-30 points)**: A device has a component that requires another component, but the required component is either missing or at the wrong version. Weighted slightly lower than a direct conflict, but still high risk.
- **Minimum Score**: 0 (scores are clamped to avoid negative numbers).

## Known Limitations

- **Mocked Extraction**: The LLM extraction is mocked using pre-seeded JSON. Real PDF ingestion using `pdfplumber` + Anthropic API requires an `ANTHROPIC_API_KEY`.
- **Simplistic Remediation**: The current remediation engine suggests direct version upgrades. A production version would use an A* shortest-path algorithm across the Neo4j graph to find a path that doesn't trigger secondary conflicts.
- **Authentication**: There is no auth layer implemented for this prototype.
