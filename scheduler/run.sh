#!/bin/bash
set -euo pipefail
set -x
export PYTHONUNBUFFERED=1

RUN_LOG_FILE="${RUN_LOG_FILE:-/tmp/tsp-allocation-engine.log}"
mkdir -p "$(dirname "$RUN_LOG_FILE")"
touch "$RUN_LOG_FILE"

# Mirror all script output to stdout so `docker run` emits it to the droplet log,
# while also keeping an in-container copy for direct inspection if needed.
exec > >(tee -a "$RUN_LOG_FILE") 2>&1

echo "[$(date)] Running TSP Allocation Engine..."
cd /app
# Scheduled runs must respect the month-end gate. A forced rebalance can still
# be launched manually with: FORCE_REBALANCE=true poetry run python algo.py
FORCE_REBALANCE=false exec make send-email
