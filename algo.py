"""Run the TSP lookback volatility-targeting allocation once."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from helpers import run_single_iteration, send_email_result

load_dotenv()

DATA_URL = "https://www.tsp.gov/data/fund-price-history.csv"
DATA_DIR = Path(os.getenv("TSP_DATA_DIR", "portfolio/data"))
CACHE_PATH = DATA_DIR / "fund-price-history.csv"

MANUAL_WEIGHTS = {
    "F Fund": 0.0,
    "C Fund": 1.0,
    "S Fund": 0.0,
    "I Fund": 0.0,
}
LOOKBACKS = {"C Fund": 150, "F Fund": 80, "I Fund": 80, "S Fund": 100}
FALLBACK_FUND = "G Fund"
VOL_LOOKBACK = 40
TARGET_ANNUAL_VOL = 0.2
TRADING_DAYS = 252
VOLATILITY_POWER = 1.0
MAX_GROSS_EXPOSURE = 1.0

if __name__ == "__main__":
    force_rebalance = os.getenv("FORCE_REBALANCE", "false").lower() == "true"
    result = run_single_iteration(
        force_rebalance=force_rebalance,
        data_dir=DATA_DIR,
        cache_path=CACHE_PATH,
        data_url=DATA_URL,
        manual_weights=MANUAL_WEIGHTS,
        lookbacks=LOOKBACKS,
        fallback_fund=FALLBACK_FUND,
        vol_lookback=VOL_LOOKBACK,
        target_annual_vol=TARGET_ANNUAL_VOL,
        trading_days=TRADING_DAYS,
        volatility_power=VOLATILITY_POWER,
        max_gross_exposure=MAX_GROSS_EXPOSURE,
    )
    print(f"Run status: {result['status']}")
    if result["status"] == "skipped":
        print(f"Reason: {result['reason']}")
    else:
        print(f"Price date: {result['price_date'].date()}")
        print(f"Target exposure: {result['exposure']:.2%}")
        if result["portfolio_volatility"] is not None:
            print(f"Portfolio volatility: {result['portfolio_volatility']:.2%}")
        print("Recommended allocation:")
        for fund, weight in result["allocation"].items():
            print(f"  {fund}: {weight:.2%}")
        print(
            "Trend signal: "
            + ", ".join(
                f"{fund}={'ON' if value else 'OFF'}"
                for fund, value in result["signals"].items()
            )
        )
    if result["status"] == "rebalanced":
        send_email_result(result)
