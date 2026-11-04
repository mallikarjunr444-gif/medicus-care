import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_sessions(client: AsyncClient, auth_headers):
    """Test listing sessions endpoint."""
    response = await client.get("/api/v1/sessions/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_session_not_found(client: AsyncClient, auth_headers):
    """Test getting a non-existent session."""
    response = await client.get("/api/v1/sessions/nonexistent-id", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_consultation_report_requires_owned_session(client: AsyncClient, auth_headers):
    response = await client.put(
        "/api/v1/consultation-reports/nonexistent-id",
        json={"report": {"x": 1}},
        headers=auth_headers,
    )
    assert response.status_code == 404
