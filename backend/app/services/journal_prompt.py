"""Select a random journal prompt."""

from sqlalchemy import func

from app.models import JournalPrompt


class JournalPromptService:
    @staticmethod
    def get_random_prompt():
        return JournalPrompt.query.order_by(func.random()).first()
