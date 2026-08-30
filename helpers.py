"""Support functions for the live TSP allocation run."""

from __future__ import annotations

import os
from datetime import date
from pathlib import Path
from urllib.request import Request, urlopen

import numpy as np
import pandas as pd

from SES import AmazonSES

MONTH_START_WINDOW_DAYS = 7


def load_prices(
    prices: pd.DataFrame | None = None,
    *,
    data_dir: Path,
    cache_path: Path,
    data_url: str,
) -> pd.DataFrame:
    if prices is None:
        data_dir.mkdir(parents=True, exist_ok=True)
        if not cache_path.exists():
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                ),
                "Accept": "text/csv,text/plain;q=0.9,*/*;q=0.8",
                "Referer": "https://www.tspfolio.com/",
            }
            request = Request(data_url, headers=headers)
            with urlopen(request, timeout=30) as response:
                cache_path.write_bytes(response.read())
        prices = pd.read_csv(cache_path)
    else:
        prices = prices.copy()

    if isinstance(prices.index, pd.DatetimeIndex):
        prices.index = pd.to_datetime(prices.index)
        prices = prices.sort_index()
    else:
        date_candidates = [
            column for column in prices.columns
            if str(column).strip().lower() in {"date", "as of date", "price date"}
        ]
        date_column = date_candidates[0] if date_candidates else prices.columns[0]
        prices[date_column] = pd.to_datetime(prices[date_column], errors="coerce")
        prices = prices.set_index(date_column).sort_index()
    prices = prices.apply(
        lambda series: pd.to_numeric(
            series.astype(str).str.replace(",", "", regex=False), errors="coerce"
        )
    )
    return prices.loc[~prices.index.duplicated(keep="last")].dropna(how="all")


def latest_allocation(
    prices: pd.DataFrame,
    *,
    manual_weights: dict[str, float],
    lookbacks: dict[str, int],
    fallback_fund: str,
    vol_lookback: int,
    target_annual_vol: float,
    trading_days: int,
    volatility_power: float,
    max_gross_exposure: float,
    high_vol_adjustment_enabled: bool,
    high_vol_threshold: float,
    high_vol_weight_multiplier: float,
    high_vol_reference_lookback: int,
) -> dict:
    weights = pd.Series(manual_weights, dtype=float)
    if weights.empty or not np.isfinite(weights).all() or (weights < 0).any():
        raise ValueError("MANUAL_WEIGHTS must contain non-negative numeric values.")
    weights = weights.drop(index=fallback_fund, errors="ignore")
    if weights.sum() <= 0:
        raise ValueError("MANUAL_WEIGHTS must contain a positive non-fallback fund.")
    weights = weights[weights > 0] / weights.sum()

    required = set(weights.index) | {fallback_fund}
    missing = sorted(required - set(prices.columns))
    if missing:
        raise ValueError(f"Funds missing from TSP data: {missing}")
    configured_lookbacks = {fund: int(lookbacks[fund]) for fund in weights.index}
    if any(value < 2 for value in configured_lookbacks.values()):
        raise ValueError("Each lookback must be at least 2 trading days.")

    selected = prices.loc[:, list(dict.fromkeys([*weights.index, fallback_fund]))].dropna()
    if high_vol_threshold <= 0:
        raise ValueError("HIGH_VOL_THRESHOLD must be greater than 0.")
    if not 0 < high_vol_weight_multiplier <= 1:
        raise ValueError("HIGH_VOL_WEIGHT_MULTIPLIER must be greater than 0 and at most 1.")
    if high_vol_reference_lookback < vol_lookback:
        raise ValueError("HIGH_VOL_REFERENCE_LOOKBACK must be at least VOL_LOOKBACK.")
    if len(selected) < max(max(configured_lookbacks.values()), high_vol_reference_lookback) + 2:
        raise ValueError("Not enough history for the configured lookbacks.")

    returns = selected.pct_change().dropna()
    signals = pd.DataFrame(index=selected.index, columns=weights.index, dtype=float)
    momentum = pd.DataFrame(index=selected.index, columns=weights.index, dtype=float)
    for fund, lookback in configured_lookbacks.items():
        signals[fund] = selected[fund].gt(selected[fund].rolling(lookback).mean()).shift(1)
        momentum[fund] = selected[fund].pct_change(lookback).shift(1)
    signals = signals.reindex(returns.index).fillna(0.0)
    volatility = returns.rolling(vol_lookback).std().shift(1) * np.sqrt(trading_days)
    score = (
        momentum.clip(lower=0.0).mul(signals).div(volatility.pow(volatility_power))
        .replace([np.inf, -np.inf], np.nan).fillna(0.0)
    )
    raw = score.mul(weights, axis=1)
    candidate = raw.div(raw.sum(axis=1).replace(0, np.nan), axis=0).fillna(0.0)
    # Volatility and tradable returns start one row after the price history.
    # Keep candidate weights on that same index before applying triggers.
    candidate = candidate.reindex(returns.index)
    candidate[fallback_fund] = 0.0
    no_signal = raw.sum(axis=1).eq(0)
    candidate.loc[no_signal, fallback_fund] = 1.0

    vol_reference = volatility[weights.index].rolling(
        high_vol_reference_lookback, min_periods=vol_lookback
    ).median().shift(1)
    vol_ratio = volatility[weights.index].div(vol_reference)
    high_vol_trigger = vol_ratio.ge(high_vol_threshold).fillna(False)
    if not high_vol_adjustment_enabled:
        high_vol_trigger.loc[:, :] = False

    def apply_high_vol_adjustment(row: pd.Series) -> pd.Series:
        triggered = high_vol_trigger.loc[row.name].reindex(row.index).fillna(False)
        penalized = triggered & row.gt(0)
        if not penalized.any():
            return row
        reduction = (row[penalized] * (1.0 - high_vol_weight_multiplier)).sum()
        row[penalized] *= high_vol_weight_multiplier
        recipients = (~penalized) & row.gt(0)
        if recipients.any() and row[recipients].sum() > 0:
            row[recipients] += reduction * row[recipients] / row[recipients].sum()
        else:
            row[fallback_fund] += reduction
        return row

    candidate = candidate.apply(apply_high_vol_adjustment, axis=1)

    periods = pd.Series(returns.index.to_period("M"), index=returns.index)
    rebalance = periods.ne(periods.shift(1)).fillna(True)
    held_weights = candidate.where(rebalance, np.nan).ffill().fillna(candidate)
    base_returns = returns.mul(held_weights).sum(axis=1)
    portfolio_vol = base_returns.rolling(vol_lookback).std().shift(1) * np.sqrt(trading_days)
    exposure = (target_annual_vol / portfolio_vol.replace(0, np.nan)).replace(
        [np.inf, -np.inf], np.nan
    ).fillna(1.0).clip(0.0, max_gross_exposure)

    latest = selected.index[-1]
    allocation = candidate.loc[latest].copy()
    if allocation.sum() <= 0:
        allocation[:] = 0.0
        allocation[fallback_fund] = 1.0
    else:
        allocation /= allocation.sum()
    return {
        "price_date": latest,
        "allocation": allocation,
        "signals": signals.loc[latest],
        "high_vol_trigger": high_vol_trigger.loc[latest],
        "exposure": float(exposure.loc[latest]),
        "portfolio_volatility": float(portfolio_vol.loc[latest])
        if pd.notna(portfolio_vol.loc[latest]) else None,
    }


def send_email_result(result: dict) -> None:
    """Email the calculated allocation when EMAIL_POSITIONS is enabled."""
    if os.getenv("EMAIL_POSITIONS", "true").strip().lower() in {"false", "0", "no", "off"}:
        return

    def env(*names: str) -> str | None:
        return next((os.getenv(name) for name in names if os.getenv(name)), None)

    region = env("AWS_SES_REGION_NAME")
    access_key = env("AWS_SES_ACCESS_KEY_ID")
    secret_key = env("AWS_SES_SECRET_ACCESS_KEY")
    from_address = env("FROM_ADDRESS")
    to_addresses = env("TO_ADDRESSES")
    missing = [name for name, value in {
        "AWS_SES_REGION_NAME": region, "AWS_SES_ACCESS_KEY_ID": access_key,
        "AWS_SES_SECRET_ACCESS_KEY": secret_key, "FROM_ADDRESS": from_address,
        "TO_ADDRESSES": to_addresses,
    }.items() if not value]
    if missing:
        raise RuntimeError(f"Missing email environment variables: {', '.join(missing)}")

    allocation = result["allocation"]
    lines = [
        f"Price date: {result['price_date'].date()}",
        f"Target exposure: {result['exposure']:.2%}",
        "",
        "Recommended allocation:",
    ]
    lines.extend(f"  {fund}: {weight:.2%}" for fund, weight in allocation.items())
    lines.append("")
    lines.append("Trend signal: " + ", ".join(
        f"{fund}={'ON' if value else 'OFF'}" for fund, value in result["signals"].items()
    ))
    ses = AmazonSES(region, access_key, secret_key, from_address)
    subject = f"TSP allocation recommendation - {result['price_date'].date()}"
    content = "\n".join(lines)
    for to_address in (address.strip() for address in to_addresses.split(",")):
        if to_address:
            ses.send_text_email(to_address, subject, content)


def run_single_iteration(
    force_rebalance: bool = False,
    *,
    run_date: date | None = None,
    prices: pd.DataFrame | None = None,
    data_dir: Path,
    cache_path: Path,
    data_url: str,
    manual_weights: dict[str, float],
    lookbacks: dict[str, int],
    fallback_fund: str,
    vol_lookback: int,
    target_annual_vol: float,
    trading_days: int,
    volatility_power: float,
    max_gross_exposure: float,
    high_vol_adjustment_enabled: bool = True,
    high_vol_threshold: float = 1.20,
    high_vol_weight_multiplier: float = 0.70,
    high_vol_reference_lookback: int = 252,
) -> dict:
    """Calculate and email one allocation.

    The normal run window is the first seven calendar days of each month.
    ``prices`` and ``run_date`` are optional test hooks that avoid downloading
    data or depending on the system clock.
    """
    current_date = pd.Timestamp(run_date or date.today())
    if not force_rebalance and current_date.day > MONTH_START_WINDOW_DAYS:
        return {
            "status": "skipped",
            "reason": "outside_month_start_window",
            "run_date": current_date.date(),
        }

    result = latest_allocation(
        load_prices(prices, data_dir=data_dir, cache_path=cache_path, data_url=data_url),
        manual_weights=manual_weights,
        lookbacks=lookbacks,
        fallback_fund=fallback_fund,
        vol_lookback=vol_lookback,
        target_annual_vol=target_annual_vol,
        trading_days=trading_days,
        volatility_power=volatility_power,
        max_gross_exposure=max_gross_exposure,
        high_vol_adjustment_enabled=high_vol_adjustment_enabled,
        high_vol_threshold=high_vol_threshold,
        high_vol_weight_multiplier=high_vol_weight_multiplier,
        high_vol_reference_lookback=high_vol_reference_lookback,
    )
    result["status"] = "rebalanced"
    return result
