"""Seed script to load realistic demo data into the configured DATABASE_URL.

Creates four rich demo users with:
- Moods for January & February (with notes)
- 3–5 habits each, with completions across Jan/Feb
- 3 journals per user, each with 3–5 entries
- ~10 planner events in March with reminders

Achievements and streaks are awarded via the existing gamification helpers.

Run once against your target DB (e.g., AWS RDS):
    export DATABASE_URL="postgresql+psycopg2://user:pass@host:5432/moody"
    export SECRET_KEY="any-string"  # required by app config
    python - <<'PY'
    from app import create_app
    from seeds import demo_seed
    app = create_app()
    with app.app_context():
        demo_seed.run()
    PY

Optional: provide comma-separated cover URLs (used round‑robin):
    export JOURNAL_COVER_URLS="https://example.com/cover1.jpg,https://example.com/cover2.jpg"
"""

from __future__ import annotations

import datetime as dt
import os
from typing import Iterable, List, Sequence

from app.extensions import db
from app.models import (
    Habit,
    HabitCompletion,
    Journal,
    JournalEntry,
    Mood,
    PlannerEvent,
    User,
)
from app.services.gamification import (
    evaluate_habit,
    evaluate_journal,
    evaluate_mood,
    evaluate_planner,
)


YEAR = dt.date.today().year  # anchor to current year

# Cycle through these mood options/notes to keep data varied but deterministic.
MOOD_SERIES: Sequence[tuple[str, str]] = [
    ("happy", "Started the day with a walk."),
    ("sad", "Low energy, taking it easy."),
    ("tired", "Did not sleep great, kept it light."),
    ("peaceful", "Quiet evening and some reading."),
    ("anxious", "Busy schedule, practiced breathing."),
]

HABIT_TEMPLATES = [
    ("Drink water", "daily", 7),
    ("Stretch", "daily", 5),
    ("Read 20 pages", "daily", 6),
    ("Walk 5k steps", "daily", 7),
    ("Plan tomorrow", "daily", 7),
]

JOURNAL_THEMES = [
    ("Gratitude", "Daily gratitude notes."),
    ("Energy log", "Tracking energy and sleep."),
    ("Wins", "Small wins and learnings."),
]

PLANNER_TITLES = [
    "Workout",
    "Deep work block",
    "Therapy session",
    "Call family",
    "Meal prep",
    "Grocery run",
    "Project milestone",
    "Study group",
    "Journal time",
    "Walk outside",
]


def daterange(start: dt.date, end: dt.date) -> Iterable[dt.date]:
    for i in range((end - start).days + 1):
        yield start + dt.timedelta(days=i)


def pick(seq: Sequence, idx: int):
    return seq[idx % len(seq)]


LOREM_PARAGRAPHS = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel justo sit amet lacus viverra tincidunt. Donec posuere, arcu et interdum consequat, ligula neque efficitur neque, a gravida mi lorem nec erat.",
    "Praesent feugiat augue id pulvinar suscipit. Aenean id imperdiet dui. Integer sed mauris et neque congue fermentum. Nam a nibh ut nisl varius pellentesque. Maecenas vel ultrices est, sed pretium sem.",
]


def build_content(text: str, variant: int = 0) -> dict:
    """TipTap/ProseMirror JSON body with richer lorem text for demo entries."""
    lorem = LOREM_PARAGRAPHS[variant % len(LOREM_PARAGRAPHS)]
    return {
        "type": "doc",
        "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": text}]},
            {"type": "paragraph", "content": [{"type": "text", "text": lorem}]},
        ],
    }


def seed_user(email: str, password: str, cover_urls: List[str]) -> None:
    user = User(email=email.lower())
    user.set_password(password)
    db.session.add(user)
    db.session.flush()  # get user.id

    # Moods for Jan + Feb
    jan_start = dt.date(YEAR, 1, 1)
    feb_end = dt.date(YEAR, 2, 28)
    for idx, day in enumerate(daterange(jan_start, feb_end)):
        mood_key, note = pick(MOOD_SERIES, idx)
        m = Mood(user_id=user.id, mood=mood_key, note=note, date=day)
        db.session.add(m)
        evaluate_mood(user.id, day)

    # Habits and completions
    habits: List[Habit] = []
    for i, tpl in enumerate(HABIT_TEMPLATES[:5]):
        title, freq, target = tpl
        h = Habit(
            user_id=user.id,
            title=title,
            frequency=freq,
            target_per_week=target,
        )
        db.session.add(h)
        habits.append(h)
    db.session.flush()

    # Completions: roughly 5 days/week across Jan+Feb
    completion_days = list(daterange(jan_start, feb_end))
    for day_idx, day in enumerate(completion_days):
        # Skip some days to avoid perfection
        if day.weekday() == 6:  # Sundays off
            continue
        for h_idx, habit in enumerate(habits):
            if (day_idx + h_idx) % 6 == 0:
                continue  # introduce gaps
            comp = HabitCompletion(
                habit_id=habit.id, user_id=user.id, date=day
            )
            db.session.add(comp)
            evaluate_habit(user.id, day)

    # Journals + entries
    for j_idx, (title, desc) in enumerate(JOURNAL_THEMES):
        cover_url = pick(cover_urls, j_idx) if cover_urls else None
        journal = Journal(
            user_id=user.id,
            title=title,
            description=desc,
            cover_url=cover_url,
        )
        db.session.add(journal)
        db.session.flush()

        entry_dates = list(daterange(dt.date(YEAR, 1, 5), dt.date(YEAR, 2, 10)))
        # 3–5 entries per journal
        for e_idx, entry_day in enumerate(entry_dates[j_idx * 3 : j_idx * 3 + 5]):
            entry = JournalEntry(
                journal_id=journal.id,
                user_id=user.id,
                title=f"{title} #{e_idx + 1}",
                content_json=build_content(
                    f"{title}: reflections on {entry_day.isoformat()}",
                    variant=e_idx,
                ),
                entry_date=entry_day,
                background="lined",
                font_family="Inter",
                font_size=16,
            )
            db.session.add(entry)
            evaluate_journal(user.id, entry_day)

    # Planner events in March (10 per user)
    for p_idx in range(10):
        day = dt.date(YEAR, 3, (p_idx % 28) + 1)
        start_time = dt.time(hour=9 + (p_idx % 6), minute=0)
        ev = PlannerEvent(
            user_id=user.id,
            title=pick(PLANNER_TITLES, p_idx),
            description="Seeded demo event",
            event_date=day,
            start_time=start_time,
            reminder_minutes_before=30,
        )
        db.session.add(ev)
        evaluate_planner(user.id, day)


def run() -> None:
    cover_env = os.getenv("JOURNAL_COVER_URLS", "").strip()
    cover_urls = [u.strip() for u in cover_env.split(",") if u.strip()]

    existing = User.query.filter(User.email.like("demo_rich_%@example.com")).count()
    if existing:
        print("Demo users already seeded; aborting to avoid duplicates.")
        return

    users = [
        ("demo_rich_1@example.com", "DemoPass123!"),
        ("demo_rich_2@example.com", "DemoPass123!"),
        ("demo_rich_3@example.com", "DemoPass123!"),
        ("demo_rich_4@example.com", "DemoPass123!"),
    ]

    for email, password in users:
        seed_user(email, password, cover_urls)

    db.session.commit()
    print(f"Seeded {len(users)} rich demo users with Jan/Feb data and March events.")


if __name__ == "__main__":
    from app import create_app

    app = create_app()
    with app.app_context():
        run()
