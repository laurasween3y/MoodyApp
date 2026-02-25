from app import create_app
from app.extensions import db
from app.models import JournalPrompt


PROMPTS = [
    {"category": "self-reflection", "text": "What did I learn about myself today?"},
    {"category": "self-reflection", "text": "Which moment today felt most like me?"},
    {"category": "self-reflection", "text": "What belief did I question or confirm today?"},
    {"category": "self-reflection", "text": "Where did I show courage, even in small ways?"},
    {"category": "self-reflection", "text": "What am I avoiding, and what might happen if I faced it?"},
    {"category": "self-reflection", "text": "What am I proud of from this week?"},
    {"category": "self-reflection", "text": "What does my inner critic sound like right now?"},
    {"category": "self-reflection", "text": "What do I need to forgive myself for?"},
    {"category": "self-reflection", "text": "What drained me today, and what restored me?"},
    {"category": "self-reflection", "text": "What would I tell a friend in my exact situation?"},
    {"category": "low-mood", "text": "What is one gentle thing I can do for myself in the next hour?"},
    {"category": "low-mood", "text": "What does my body need right now: rest, food, water, movement, or quiet?"},
    {"category": "low-mood", "text": "Which tiny task would make today feel 1% lighter?"},
    {"category": "low-mood", "text": "Who can I reach out to, and what could I say?"},
    {"category": "low-mood", "text": "What is one thing I can let go of for today?"},
    {"category": "low-mood", "text": "What is a safe place I can mentally return to?"},
    {"category": "low-mood", "text": "What have I survived before that reminds me I'm capable?"},
    {"category": "low-mood", "text": "What thought keeps looping, and is it fully true?"},
    {"category": "low-mood", "text": "What would kindness toward myself look like right now?"},
    {"category": "low-mood", "text": "What is one sensory comfort I can create right now?"},
    {"category": "high-mood", "text": "What’s giving me energy right now, and how can I amplify it?"},
    {"category": "high-mood", "text": "Who could I share this good feeling with?"},
    {"category": "high-mood", "text": "What bold step feels possible today?"},
    {"category": "high-mood", "text": "How can I capture this moment so I remember it later?"},
    {"category": "high-mood", "text": "What do I want to celebrate about myself today?"},
    {"category": "high-mood", "text": "Which habit would be easiest to build while I feel this good?"},
    {"category": "high-mood", "text": "What opportunity should I say yes to right now?"},
    {"category": "high-mood", "text": "What would I do if I trusted this feeling to last?"},
    {"category": "high-mood", "text": "How can I use this momentum to help future me?"},
    {"category": "high-mood", "text": "What’s one playful thing I want to do today?"},
    {"category": "growth", "text": "What challenge is nudging me to grow right now?"},
    {"category": "growth", "text": "What’s one skill I want to practice this week?"},
    {"category": "growth", "text": "Where did I stumble recently, and what did it teach me?"},
    {"category": "growth", "text": "What tiny experiment could move me forward?"},
    {"category": "growth", "text": "What boundary would protect my growth?"},
    {"category": "growth", "text": "What does progress look like, not perfection?"},
    {"category": "growth", "text": "What habit would make the biggest difference over 30 days?"},
    {"category": "growth", "text": "What feedback should I take seriously, and what can I release?"},
    {"category": "growth", "text": "What’s the next right step—not the whole plan?"},
    {"category": "growth", "text": "How can I make this change easier to repeat?"},
    {"category": "relationships", "text": "Who made me feel seen lately, and how can I show appreciation?"},
    {"category": "relationships", "text": "What conversation have I been avoiding?"},
    {"category": "relationships", "text": "Where do I need clearer boundaries?"},
    {"category": "relationships", "text": "What do I need from others that I haven’t asked for?"},
    {"category": "relationships", "text": "How have I shown up as a good friend lately?"},
    {"category": "relationships", "text": "What assumption am I making about someone?"},
    {"category": "relationships", "text": "Who do I miss, and why?"},
    {"category": "relationships", "text": "How can I listen better in my next conversation?"},
    {"category": "relationships", "text": "What pattern keeps showing up in my relationships?"},
    {"category": "relationships", "text": "What’s one small act of care I can offer today?"},
    {"category": "mindfulness", "text": "What do I notice in my body right now?"},
    {"category": "mindfulness", "text": "What sounds can I hear in this moment?"},
    {"category": "mindfulness", "text": "If I take three slow breaths, what changes?"},
    {"category": "mindfulness", "text": "What emotions are present, without judging them?"},
    {"category": "mindfulness", "text": "What does the air feel like on my skin?"},
    {"category": "mindfulness", "text": "What is one thing in my space I can appreciate?"},
    {"category": "mindfulness", "text": "Where in my day can I create a pause?"},
    {"category": "mindfulness", "text": "What is one thought I can watch pass by instead of chase?"},
    {"category": "mindfulness", "text": "How does my posture affect my mood right now?"},
    {"category": "mindfulness", "text": "What am I grateful for in this exact moment?"},
]


def seed_journal_prompts():
    existing = {prompt.text for prompt in JournalPrompt.query.all()}
    to_insert = [JournalPrompt(**prompt) for prompt in PROMPTS if prompt["text"] not in existing]
    if to_insert:
        db.session.add_all(to_insert)
        db.session.commit()


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_journal_prompts()
