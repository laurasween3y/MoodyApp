from flask import Flask
from flask_smorest import Api
from flask_cors import CORS
from flask import send_from_directory
import os

from app.config import Config
from app.extensions import db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

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
    ]

    cors_resources = {
        r"/moods/*": {"origins": allowed_origins},
        r"/auth/*": {"origins": allowed_origins},
        r"/journals/*": {"origins": allowed_origins},
        r"/habits/*": {"origins": allowed_origins},
        r"/planner/*": {"origins": allowed_origins},
        r"/uploads/*": {"origins": allowed_origins},
    }
    CORS(app, resources=cors_resources)

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


    # Optional auto-create for local dev only; keep off in production.
    if os.getenv("AUTO_CREATE_DB", "").lower() in {"1", "true", "yes"}:
        with app.app_context():
            db.create_all()

    from app.blueprints.moods import blp as MoodsBlueprint
    from app.blueprints.auth import blp as AuthBlueprint
    from app.blueprints.journals import blp as JournalsBlueprint
    from app.blueprints.habits import blp as HabitsBlueprint
    from app.blueprints.planner import blp as PlannerBlueprint

    api.register_blueprint(MoodsBlueprint)
    api.register_blueprint(AuthBlueprint)
    api.register_blueprint(JournalsBlueprint)
    api.register_blueprint(HabitsBlueprint)
    api.register_blueprint(PlannerBlueprint)

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    return app
