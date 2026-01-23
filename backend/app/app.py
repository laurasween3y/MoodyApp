from flask import Flask
from flask_smorest import Api
from flask_cors import CORS

from app.config import Config
from app.extensions import db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    # Allow local dev frontend (Angular on 4200) to call the API
    cors_resources = {
        r"/moods/*": {
            "origins": [
                "http://localhost:4200",
                "http://127.0.0.1:4200",
                "http://localhost:8080",
                "http://127.0.0.1:8080",
            ]
        },
        r"/auth/*": {
            "origins": [
                "http://localhost:4200",
                "http://127.0.0.1:4200",
                "http://localhost:8080",
                "http://127.0.0.1:8080",
            ]
        },
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

    # Import models before create_all so tables are registered
    from app import models  # noqa: F401

    # Create tables automatically for simple deployments
    with app.app_context():
        db.create_all()

    from app.blueprints.moods import blp as MoodsBlueprint
    from app.blueprints.auth import blp as AuthBlueprint

    api.register_blueprint(MoodsBlueprint)
    api.register_blueprint(AuthBlueprint)

    return app
