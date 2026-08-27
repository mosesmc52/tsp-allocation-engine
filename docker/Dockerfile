FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    TZ=America/New_York \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      cron supervisor tzdata \
    && rm -rf /var/lib/apt/lists/*

RUN python -m pip install --upgrade pip --no-cache-dir \
    && python -m pip install poetry --no-cache-dir

COPY poetry.lock pyproject.toml /app/
RUN poetry install --no-interaction --no-root

# Application + cron + supervisor. Secrets are supplied at runtime via .env.
COPY algo.py helpers.py SES.py /app/
COPY scheduler/run.sh /app/run.sh
COPY scheduler/crontab /etc/cron.d/weekly-job
COPY supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# permissions (no 'crontab' here!)
RUN chmod +x /app/run.sh \
 && chmod 0644 /etc/cron.d/weekly-job \
 && touch /var/log/cron.log

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
