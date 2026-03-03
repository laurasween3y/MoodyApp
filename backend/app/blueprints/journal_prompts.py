"""Journal prompts blueprint (fetch a random prompt for the editor UI)."""

from flask.views import MethodView
from flask_smorest import Blueprint, abort

from app.auth_utils import jwt_required
from app.schemas.journal_prompt import JournalPromptSchema
from app.services.journal_prompt import JournalPromptService

blp = Blueprint(
    "journal_prompts",
    __name__,
    url_prefix="/journal-prompts",
    description="Journal prompts",
)


@blp.route("/random")
class JournalPromptRandomResource(MethodView):
    decorators = [jwt_required]
    @blp.response(200, JournalPromptSchema)
    def get(self):
        prompt = JournalPromptService.get_random_prompt()
        if not prompt:
            abort(404, message="No journal prompts available")
        return prompt
