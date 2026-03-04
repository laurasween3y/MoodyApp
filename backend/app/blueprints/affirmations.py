"""Fetch a random affirmation with a fallback string."""

from typing import Optional

import requests

from flask.views import MethodView
from flask_smorest import Blueprint

from app.schemas.affirmation import AffirmationResponseSchema

API_URL = "https://www.affirmations.dev/"
FALLBACK_AFFIRMATION = "You're doing better than you think 💛"

blp = Blueprint(
    "affirmations",
    __name__,
    url_prefix="/affirmations",
    description="Fetch a random affirmation",
)


def _fetch_affirmation() -> Optional[str]:
    try:
        response = requests.get(API_URL, headers={"Accept": "application/json"}, timeout=5)
        response.raise_for_status()
        payload = response.json()
        if isinstance(payload, dict):
            affirmation = payload.get("affirmation")
            if isinstance(affirmation, str) and affirmation.strip():
                return affirmation.strip()
    except (requests.RequestException, ValueError):
        return None
    return None


@blp.route("/")
class AffirmationResource(MethodView):
    @blp.response(200, AffirmationResponseSchema)
    def get(self):
        """Return a random affirmation."""

        affirmation = _fetch_affirmation() or FALLBACK_AFFIRMATION
        return {"affirmation": affirmation}
