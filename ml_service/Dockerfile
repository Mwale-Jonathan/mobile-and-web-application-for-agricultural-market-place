# syntax=docker/dockerfile:1

FROM ghcr.io/astral-sh/uv:0.12.15 AS uv

FROM python:3.12-slim-bookworm AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

COPY --from=uv /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock README.md ./
COPY src ./src

RUN uv sync --frozen --no-dev --no-install-project

FROM python:3.12-slim-bookworm AS runtime

ENV PATH="/app/.venv/bin:$PATH" \
    PORT=8080 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN groupadd --system app && \
    useradd --system --gid app --home-dir /app app

COPY --from=builder --chown=app:app /app/.venv /app/.venv
COPY --chown=app:app api ./api
COPY --chown=app:app src ./src
COPY --chown=app:app models/best_model.joblib models/metadata.json ./models/
COPY --chown=app:app data/processed/panel_monthly.csv ./data/processed/panel_monthly.csv

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:' + os.environ.get('PORT', '8080') + '/health', timeout=4)"

CMD ["sh", "-c", "exec uvicorn api.main:app --host 0.0.0.0 --port \"${PORT:-8080}\""]
