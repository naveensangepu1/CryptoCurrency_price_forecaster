# Production image for the FastAPI backend.
#   docker build -t crypto-forecaster-api backend
#   docker run -p 8000:8000 crypto-forecaster-api
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /srv

# Install dependencies first so this layer is cached when only the code changes.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app

# Don't run as root. yfinance keeps a small cache in the home directory, so create one.
RUN useradd --create-home appuser
USER appuser

# Render, Railway, Fly.io etc. pass the port to listen on in $PORT.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
