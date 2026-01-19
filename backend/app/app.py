from flask import Flask
from flask_smorest import Api

from app.config import Config
from app.extensions import db


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    # Flask-Smorest / OpenAPI configuration
    app.config["API_TITLE"] = "Moody API"
    app.config["API_VERSION"] = "v1"
    app.config["OPENAPI_VERSION"] = "3.0.3"
    app.config["OPENAPI_JSON_PATH"] = "/openapi.json"
    app.config["OPENAPI_SWAGGER_UI_PATH"] = "/swagger"
    app.config["OPENAPI_SWAGGER_UI_URL"] = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"

    api = Api(app)
    db.init_app(app)

    from app.blueprints.moods import blp as MoodsBlueprint

    api.register_blueprint(MoodsBlueprint)

    return app
