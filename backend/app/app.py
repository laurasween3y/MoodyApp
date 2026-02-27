from flask import Flask, jsonify, send_from_directory
from flask_smorest import Api
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
import os

from app.config import Config
from app.extensions import db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")

    # File uploads (journal covers)
    upload_folder = os.path.join(app.root_path, "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = upload_folder

    # Allow local dev frontend (Angular on 4200) to call the API
    allowed_origins = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:4300",
        "http://127.0.0.1:4300",
    ]

    cors_rule = {
        "origins": allowed_origins,
        "allow_headers": ["Authorization", "Content-Type"],
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }

    cors_resources = {
        r"/moods/*": cors_rule,
        r"/auth/*": cors_rule,
        r"/journals/*": cors_rule,
        r"/habits/*": cors_rule,
        r"/planner/*": cors_rule,
        r"/progress/*": cors_rule,
        r"/profile*": cors_rule,
        r"/affirmations*": cors_rule,
        r"/journal-prompts*": cors_rule,
        r"/notification-settings*": cors_rule,
        r"/uploads/*": cors_rule,
    }
    CORS(app, resources=cors_resources, supports_credentials=True)

    # Flask-Smorest / OpenAPI configuration
    app.config["API_TITLE"] = "Moody API"
    app.config["API_VERSION"] = "v1"
    app.config["OPENAPI_VERSION"] = "3.0.3"
    app.config["OPENAPI_URL_PREFIX"] = ""
    app.config["OPENAPI_JSON_PATH"] = "openapi.json"
    app.config["OPENAPI_SWAGGER_UI_PATH"] = "swagger"
    app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"

    api = Api(app)
    db.init_app(app)

    from app import models  

    from app.blueprints.moods import blp as MoodsBlueprint
    from app.blueprints.auth import blp as AuthBlueprint
    from app.blueprints.journals import blp as JournalsBlueprint
    from app.blueprints.habits import blp as HabitsBlueprint
    from app.blueprints.planner import blp as PlannerBlueprint
    from app.blueprints.progress import blp as ProgressBlueprint
    from app.blueprints.profile import blp as ProfileBlueprint
    from app.blueprints.affirmations import blp as AffirmationsBlueprint
    from app.blueprints.journal_prompts import blp as JournalPromptsBlueprint
    from app.blueprints.notification_settings import blp as NotificationSettingsBlueprint

    api.register_blueprint(MoodsBlueprint)
    api.register_blueprint(AuthBlueprint)
    api.register_blueprint(JournalsBlueprint)
    api.register_blueprint(HabitsBlueprint)
    api.register_blueprint(PlannerBlueprint)
    api.register_blueprint(ProgressBlueprint)
    api.register_blueprint(ProfileBlueprint)
    api.register_blueprint(AffirmationsBlueprint)
    api.register_blueprint(JournalPromptsBlueprint)
    api.register_blueprint(NotificationSettingsBlueprint)

    @app.errorhandler(HTTPException)
    def handle_http_exception(err: HTTPException):
        payload = {"message": err.description or "Request failed"}
        data = getattr(err, "data", None)
        if isinstance(data, dict):
            if data.get("message"):
                payload["message"] = data["message"]
            if data.get("errors"):
                payload["errors"] = data["errors"]
            if data.get("messages"):
                payload["messages"] = data["messages"]
        return jsonify(payload), err.code or 500

    @app.errorhandler(Exception)
    def handle_unexpected_exception(err: Exception):
        app.logger.exception("Unhandled exception")
        return jsonify({"message": "Unexpected server error"}), 500

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    return app
