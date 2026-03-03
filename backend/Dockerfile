# Use official Python image
FROM python:3.12-slim

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
# Ensure logs appear in Docker logs immediately
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY .. .

# Expose Flask default port
EXPOSE 5000

# Run the application
CMD ["flask", "run", "--host=0.0.0.0"]
