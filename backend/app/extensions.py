"""Central place to hold Flask extensions so they can be imported safely.
Initialized in app factory to avoid circular imports when blueprints/models load."""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

db = SQLAlchemy()
migrate = Migrate()
