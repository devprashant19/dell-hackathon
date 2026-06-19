def generate_explanation(violation: dict) -> str:
    return violation.get("explanation", "Violation details are unclear. Please review the system logs.")

def get_explanations_for_device(violations: list) -> list:
    return [generate_explanation(v) for v in violations]
