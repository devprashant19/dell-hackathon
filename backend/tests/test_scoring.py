import pytest
from app.services.scoring import score_device

# This is a unit test that verifies the scoring math assuming the database is seeded.
# We will mock the database call to return a specific set of rules and components.

def test_score_device_mocked(mocker):
    # Mock the get_db to return a mock session
    mock_session = mocker.MagicMock()
    
    # Mocking missing REQUIRES query result
    mock_req_res = [
        {"subject": "A", "missing_requirement": "B", "expected_version": "1.0", "r": {"rule_id": "R1"}}
    ]
    # Mocking CONFLICTS_WITH query result
    mock_conf_res = [
        {"subject": "C", "conflict": "D", "conflict_version": "2.0", "r": {"rule_id": "R2"}}
    ]
    
    def mock_run(query, **kwargs):
        if "REQUIRES" in query:
            return mock_req_res
        elif "CONFLICTS_WITH" in query:
            return mock_conf_res
        return []

    mock_session.run = mock_run
    
    # Mock get_db context manager
    mocker.patch("app.services.scoring.get_db", return_value=mocker.MagicMock(__enter__=lambda x: mock_session, __exit__=lambda *args: None))
    
    result = score_device("DV-MOCK")
    
    assert result["device_id"] == "DV-MOCK"
    # Starting score 100
    # -30 for MISSING_REQUIREMENT
    # -40 for CONFLICT
    # = 30
    assert result["score"] == 30
    assert len(result["violations"]) == 2
    assert result["violations"][0]["type"] == "MISSING_REQUIREMENT"
    assert result["violations"][1]["type"] == "CONFLICT"
