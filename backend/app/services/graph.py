import os
from neo4j import GraphDatabase

NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://neo4j:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "compatiqpassword")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

def get_db():
    return driver.session()

def init_schema():
    with get_db() as session:
        session.run("CREATE CONSTRAINT component_unique IF NOT EXISTS FOR (c:Component) REQUIRE (c.type, c.name, c.version) IS UNIQUE")
        session.run("CREATE CONSTRAINT rule_unique IF NOT EXISTS FOR (r:Rule) REQUIRE r.rule_id IS UNIQUE")
        session.run("CREATE CONSTRAINT device_unique IF NOT EXISTS FOR (d:Device) REQUIRE d.device_id IS UNIQUE")

def add_rule_to_graph(rule_data: dict):
    with get_db() as session:
        # Create Rule node
        session.run(
            """
            MERGE (r:Rule {rule_id: $rule_id})
            SET r.rule_type = $rule_type,
                r.source_doc = $source_doc,
                r.source_page = $source_page,
                r.confidence = $confidence,
                r.raw_excerpt = $raw_excerpt,
                r.ambiguous = $ambiguous,
                r.extraction_notes = $extraction_notes
            """, 
            **rule_data
        )

        # Subject Component
        subj = rule_data["subject_component"]
        session.run(
            """
            MERGE (c:Component {type: $type, name: $name, version_constraint: $version_constraint})
            WITH c
            MATCH (r:Rule {rule_id: $rule_id})
            MERGE (r)-[:SUBJECT_OF]->(c)
            """,
            type=subj["type"], name=subj["name"], version_constraint=subj["version_constraint"], rule_id=rule_data["rule_id"]
        )

        # Depends On
        for dep in (rule_data.get("depends_on") or []):
            session.run(
                """
                MERGE (c:Component {type: $type, name: $name, version_constraint: $version_constraint})
                WITH c
                MATCH (r:Rule {rule_id: $rule_id})
                MERGE (r)-[:REQUIRES]->(c)
                """,
                type=dep["type"], name=dep["name"], version_constraint=dep["version_constraint"], rule_id=rule_data["rule_id"]
            )

        # Conflicts With
        for conf in (rule_data.get("conflicts_with") or []):
            session.run(
                """
                MERGE (c:Component {type: $type, name: $name, version_constraint: $version_constraint})
                WITH c
                MATCH (r:Rule {rule_id: $rule_id})
                MERGE (r)-[:CONFLICTS_WITH]->(c)
                """,
                type=conf["type"], name=conf["name"], version_constraint=conf["version_constraint"], rule_id=rule_data["rule_id"]
            )
