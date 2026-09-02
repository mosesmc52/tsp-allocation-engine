"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Shield,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Scale,
  Mail,
  ArrowDown,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  REAL TSP DATA — Jan 2002 – Aug 2026                                 */
/*  This window is used because the S and I Funds didn't exist before   */
/*  May 2001 — starting in 2002 lets all five funds be compared fairly. */
/*                                                                      */
/*  G Fund: real published MONTHLY returns.                             */
/*  C, S, I, F Funds: real published CALENDAR-YEAR returns; the         */
/*  month-to-month path is a modeled estimate that always adds up to    */
/*  the real yearly number — see the notes at the bottom of the page.   */
/* ------------------------------------------------------------------ */

const G_FUND_MONTHLY = {
  2002: [0.45, 0.40, 0.44, 0.46, 0.45, 0.43, 0.43, 0.40, 0.37, 0.33, 0.34, 0.38],
  2003: [0.35, 0.32, 0.33, 0.33, 0.34, 0.20, 0.30, 0.40, 0.40, 0.30, 0.30, 0.49],
  2004: [0.29, 0.39, 0.29, 0.29, 0.39, 0.38, 0.38, 0.38, 0.38, 0.38, 0.28, 0.38],
  2005: [0.37, 0.37, 0.37, 0.37, 0.37, 0.28, 0.37, 0.37, 0.36, 0.36, 0.36, 0.45],
  2006: [0.36, 0.36, 0.36, 0.44, 0.44, 0.44, 0.44, 0.44, 0.35, 0.43, 0.43, 0.34],
  2007: [0.43, 0.34, 0.42, 0.42, 0.34, 0.42, 0.50, 0.33, 0.41, 0.41, 0.33, 0.41],
  2008: [0.33, 0.24, 0.32, 0.24, 0.32, 0.32, 0.40, 0.33, 0.31, 0.31, 0.31, 0.24],
  2009: [0.19, 0.21, 0.24, 0.21, 0.25, 0.27, 0.28, 0.28, 0.26, 0.26, 0.26, 0.25],
  2010: [0.29, 0.24, 0.27, 0.28, 0.28, 0.24, 0.23, 0.22, 0.17, 0.18, 0.17, 0.20],
  2011: [0.24, 0.22, 0.26, 0.25, 0.25, 0.21, 0.22, 0.19, 0.16, 0.14, 0.14, 0.15],
  2012: [0.13, 0.12, 0.14, 0.15, 0.14, 0.11, 0.12, 0.11, 0.10, 0.12, 0.11, 0.12],
  2013: [0.13, 0.13, 0.13, 0.12, 0.12, 0.14, 0.18, 0.18, 0.19, 0.19, 0.18, 0.19],
  2014: [0.21, 0.18, 0.19, 0.20, 0.20, 0.19, 0.19, 0.20, 0.18, 0.20, 0.17, 0.18],
  2015: [0.18, 0.13, 0.16, 0.15, 0.17, 0.17, 0.19, 0.18, 0.18, 0.17, 0.17, 0.18],
  2016: [0.19, 0.15, 0.15, 0.14, 0.15, 0.15, 0.13, 0.13, 0.13, 0.14, 0.16, 0.20],
  2017: [0.20, 0.18, 0.20, 0.20, 0.19, 0.19, 0.19, 0.19, 0.17, 0.19, 0.19, 0.20],
  2018: [0.20, 0.21, 0.24, 0.23, 0.24, 0.24, 0.25, 0.26, 0.24, 0.26, 0.26, 0.26],
  2019: [0.23, 0.20, 0.23, 0.21, 0.21, 0.19, 0.18, 0.18, 0.14, 0.14, 0.14, 0.16],
  2020: [0.17, 0.13, 0.11, 0.07, 0.06, 0.06, 0.06, 0.05, 0.06, 0.06, 0.07, 0.07],
  2021: [0.07, 0.08, 0.11, 0.13, 0.13, 0.12, 0.13, 0.11, 0.11, 0.13, 0.13, 0.12],
  2022: [0.13, 0.14, 0.17, 0.20, 0.21, 0.29, 0.26, 0.25, 0.28, 0.34, 0.35, 0.32],
  2023: [0.34, 0.28, 0.35, 0.30, 0.31, 0.32, 0.34, 0.35, 0.35, 0.40, 0.41, 0.39],
  2024: [0.34, 0.33, 0.38, 0.35, 0.41, 0.38, 0.39, 0.35, 0.33, 0.33, 0.36, 0.36],
  2025: [0.39, 0.36, 0.37, 0.35, 0.36, 0.37, 0.37, 0.37, 0.35, 0.36, 0.34, 0.35],
  2026: [0.37, 0.33, 0.34, 0.36, 0.39, 0.37, 0.39, 0.35],
};

const YEARS = Object.keys(G_FUND_MONTHLY).map(Number).sort((a, b) => a - b);

const ANNUAL = {
  C: { 2002: -22.1, 2003: 28.6, 2004: 10.8, 2005: 5.0, 2006: 15.8, 2007: 5.5, 2008: -37.0, 2009: 26.7, 2010: 15.1, 2011: 2.1, 2012: 16.1, 2013: 32.4, 2014: 13.8, 2015: 1.5, 2016: 12.0, 2017: 21.8, 2018: -4.4, 2019: 31.5, 2020: 18.3, 2021: 28.7, 2022: -18.1, 2023: 26.2, 2024: 25.0, 2025: 17.8, 2026: 13.0 },
  S: { 2002: -17.8, 2003: 43.4, 2004: 18.0, 2005: 10.5, 2006: 15.3, 2007: 5.5, 2008: -38.3, 2009: 34.8, 2010: 29.1, 2011: -3.4, 2012: 18.6, 2013: 38.3, 2014: 7.8, 2015: -2.9, 2016: 16.3, 2017: 18.2, 2018: -9.3, 2019: 28.0, 2020: 31.9, 2021: 12.5, 2022: -26.3, 2023: 25.3, 2024: 16.9, 2025: 11.4, 2026: 17.5 },
  I: { 2002: -15.7, 2003: 38.3, 2004: 20.0, 2005: 13.6, 2006: 26.3, 2007: 11.4, 2008: -42.4, 2009: 30.0, 2010: 7.9, 2011: -11.8, 2012: 18.6, 2013: 22.1, 2014: -5.3, 2015: -0.5, 2016: 2.1, 2017: 25.4, 2018: -13.4, 2019: 22.5, 2020: 8.2, 2021: 11.5, 2022: -13.9, 2023: 18.4, 2024: 4.3, 2025: 32.5, 2026: 19.7 },
  F: { 2002: 10.3, 2003: 4.1, 2004: 4.3, 2005: 2.4, 2006: 4.4, 2007: 7.1, 2008: 5.5, 2009: 6.0, 2010: 6.7, 2011: 7.9, 2012: 4.3, 2013: -1.7, 2014: 6.7, 2015: 0.9, 2016: 2.9, 2017: 3.8, 2018: 0.2, 2019: 8.7, 2020: 7.5, 2021: -1.5, 2022: -12.8, 2023: 5.6, 2024: 1.3, 2025: 7.2, 2026: 0.3 },
};

const VOL = {
  C: { 2002: 25, 2003: 18, 2004: 11, 2005: 10, 2006: 10, 2007: 16, 2008: 37, 2009: 28, 2010: 18, 2011: 22, 2012: 13, 2013: 11, 2014: 12, 2015: 15, 2016: 13, 2017: 7, 2018: 17, 2019: 13, 2020: 34, 2021: 13, 2022: 24, 2023: 14, 2024: 13, 2025: 14, 2026: 15 },
  S: { 2002: 28, 2003: 22, 2004: 14, 2005: 13, 2006: 13, 2007: 19, 2008: 40, 2009: 32, 2010: 22, 2011: 26, 2012: 16, 2013: 14, 2014: 15, 2015: 18, 2016: 16, 2017: 10, 2018: 20, 2019: 16, 2020: 38, 2021: 16, 2022: 27, 2023: 17, 2024: 16, 2025: 17, 2026: 18 },
  I: { 2002: 22, 2003: 17, 2004: 13, 2005: 12, 2006: 12, 2007: 17, 2008: 38, 2009: 26, 2010: 20, 2011: 23, 2012: 15, 2013: 13, 2014: 13, 2015: 14, 2016: 13, 2017: 10, 2018: 16, 2019: 12, 2020: 26, 2021: 13, 2022: 20, 2023: 13, 2024: 12, 2025: 14, 2026: 14 },
  F: { 2002: 5, 2003: 4, 2004: 4, 2005: 4, 2006: 4, 2007: 5, 2008: 7, 2009: 6, 2010: 5, 2011: 5, 2012: 4, 2013: 4, 2014: 4, 2015: 3, 2016: 3, 2017: 3, 2018: 3, 2019: 4, 2020: 5, 2021: 4, 2022: 9, 2023: 6, 2024: 5, 2025: 5, 2026: 4 },
};

/* Fixed rule the strategy follows — not shown as a control, just how it behaves */
const STRATEGY = { shortMA: 3, longMA: 10, volTarget: 0.12, volWindow: 6 };

/* ------------------------------------------------------------------ */
/*  Seeded RNG                                                          */
/* ------------------------------------------------------------------ */

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussian(rand) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function buildAnnualCalibratedSeries(fundKey, seed) {
  const rand = mulberry32(seed);
  const out = [];
  YEARS.forEach((year) => {
    const monthsInYear = G_FUND_MONTHLY[year].length;
    const targetTotal = ANNUAL[fundKey][year] / 100;
    const sigmaAnn = (VOL[fundKey][year] || 15) / 100;
    const sigmaM = sigmaAnn / Math.sqrt(12);
    const raw = Array.from({ length: monthsInYear }, () => gaussian(rand) * sigmaM);
    let prod = raw.reduce((p, r) => p * (1 + r), 1);
    prod = Math.max(prod, 0.2);
    const adj = Math.pow((1 + targetTotal) / prod, 1 / monthsInYear);
    const final = raw.map((r) => (1 + r) * adj - 1);
    final.forEach((ret, idx) => out.push({ year, month: idx + 1, ret }));
  });
  return out;
}

function buildSeries() {
  const cSeries = buildAnnualCalibratedSeries("C", 20260827);
  const sSeries = buildAnnualCalibratedSeries("S", 19010501);
  const iSeries = buildAnnualCalibratedSeries("I", 19010502);
  const fSeries = buildAnnualCalibratedSeries("F", 19880129);
  const spySeries = buildAnnualCalibratedSeries("C", 77009901);
  const noiseRand = mulberry32(4242);

  const merged = [];
  YEARS.forEach((year) => {
    const gArr = G_FUND_MONTHLY[year];
    gArr.forEach((gPct, idx) => {
      const flatIdx = merged.length;
      const cRet = cSeries[flatIdx].ret;
      const spyNoise = gaussian(noiseRand) * 0.0015;
      const spyRet = spySeries[flatIdx].ret * 0.85 + cRet * 0.15 + spyNoise;
      merged.push({
        year,
        month: idx + 1,
        label: `${String(idx + 1).padStart(2, "0")}/${String(year).slice(2)}`,
        dateLabel: new Date(year, idx, 1).toLocaleString("en-US", { month: "short", year: "numeric" }),
        cRet,
        gRet: gPct / 100,
        sRet: sSeries[flatIdx].ret,
        iRet: iSeries[flatIdx].ret,
        fRet: fSeries[flatIdx].ret,
        spyRet,
      });
    });
  });
  return merged;
}

/* ------------------------------------------------------------------ */
/*  Strategy engine — runs on the FULL history so early months in a     */
/*  user-selected window still have real trend/volatility context       */
/* ------------------------------------------------------------------ */

function runTacticalStrategy(series, { shortMA, longMA, volTarget, volWindow }) {
  const n = series.length;
  const cPrices = [1];
  series.forEach((m) => cPrices.push(cPrices[cPrices.length - 1] * (1 + m.cRet)));

  const monthly = [];
  for (let i = 0; i < n; i++) {
    let weightC = 0;
    let signal = "defensive";
    if (i >= longMA) {
      const shortSlice = cPrices.slice(i - shortMA + 1, i + 1);
      const longSlice = cPrices.slice(i - longMA + 1, i + 1);
      const shortAvg = shortSlice.reduce((a, b) => a + b, 0) / shortSlice.length;
      const longAvg = longSlice.reduce((a, b) => a + b, 0) / longSlice.length;
      if (shortAvg > longAvg) {
        signal = "bullish";
        const start = Math.max(0, i - volWindow);
        const trailing = series.slice(start, i).map((m) => m.cRet);
        if (trailing.length >= 3) {
          const mean = trailing.reduce((a, b) => a + b, 0) / trailing.length;
          const variance = trailing.reduce((a, b) => a + (b - mean) ** 2, 0) / trailing.length;
          const sigmaAnn = Math.sqrt(Math.max(variance, 0)) * Math.sqrt(12);
          weightC = sigmaAnn > 0 ? Math.min(1, volTarget / sigmaAnn) : 1;
        } else {
          weightC = 1;
        }
      }
    }
    const ret = weightC * series[i].cRet + (1 - weightC) * series[i].gRet;
    monthly.push({ ...series[i], ret, weightC, signal });
  }
  return monthly;
}

/* ------------------------------------------------------------------ */
/*  Metrics                                                             */
/* ------------------------------------------------------------------ */

function computeMetrics(returns, riskFree) {
  const n = returns.length;
  let value = 1, peak = 1, maxDD = 0;
  const path = [1];
  returns.forEach((r) => {
    value *= 1 + r;
    path.push(value);
    if (value > peak) peak = value;
    const dd = (value - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  });
  const years = n / 12;
  const cagr = Math.pow(value, 1 / years) - 1;

  const excess = returns.map((r, i) => r - (riskFree[i] || 0));
  const meanEx = excess.reduce((a, b) => a + b, 0) / n;
  const stdEx = Math.sqrt(excess.reduce((a, b) => a + (b - meanEx) ** 2, 0) / Math.max(n - 1, 1));
  const sharpe = stdEx > 0 ? (meanEx / stdEx) * Math.sqrt(12) : 0;

  const downside = excess.filter((e) => e < 0);
  const downsideDev = Math.sqrt(downside.reduce((a, b) => a + b * b, 0) / n);
  const sortino = downsideDev > 0 ? (meanEx / downsideDev) * Math.sqrt(12) : 0;

  const calmar = maxDD !== 0 ? cagr / Math.abs(maxDD) : NaN;

  return { cagr, maxDD, sharpe, sortino, calmar, path };
}

const fmtPct = (x) => (x * 100).toFixed(1) + "%";
const fmtRatio = (x) => (Number.isFinite(x) ? x.toFixed(2) : "—");

/* ------------------------------------------------------------------ */
/*  Design tokens — light theme                                         */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#FAF7F0",
  panel: "#FFFFFF",
  panel2: "#F2EEE3",
  line: "#E3DDCC",
  text: "#2B2621",
  textDim: "#756E5F",
  gold: "#A9790C",
  teal: "#1F7A6C",
  rust: "#B23A2E",
  steel: "#3E6488",
  violet: "#6E5A9C",
  sand: "#8C6A3F",
};

const FUND_COLORS = { C: C.teal, G: C.gold, S: C.rust, I: C.violet, F: C.sand };
const FUND_NAMES = { C: "stocks (C Fund)", G: "safe bonds (G Fund)", S: "small companies (S Fund)", I: "overseas stocks (I Fund)", F: "bonds (F Fund)" };

/* ------------------------------------------------------------------ */
/*  UI atoms                                                            */
/* ------------------------------------------------------------------ */

function AllocSlider({ fundKey, value, onChange, normalizedPct }) {
  const accent = FUND_COLORS[fundKey];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.textDim, fontFamily: "'Inter',sans-serif" }}>
          <span style={{ color: accent, fontWeight: 700 }}>{fundKey}</span> — {FUND_NAMES[fundKey]}
        </span>
        <span style={{ fontSize: 12.5, fontFamily: "'IBM Plex Mono',monospace", color: accent, fontWeight: 700 }}>
          {normalizedPct.toFixed(0)}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: accent, cursor: "pointer", color: accent }}
      />
    </div>
  );
}

function DateSlider({ label, value, min, max, onChange, dateText, accent }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.textDim, fontFamily: "'Inter',sans-serif" }}>{label}</span>
        <span style={{ fontSize: 12.5, fontFamily: "'IBM Plex Mono',monospace", color: accent, fontWeight: 700 }}>
          {dateText}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: accent, cursor: "pointer", color: accent }}
      />
    </div>
  );
}

function MetricCard({ label, plain, strat, passive, spy, format, higherIsBetter = true }) {
  const vals = [strat, passive, spy];
  const best = higherIsBetter ? Math.max(...vals) : Math.min(...vals);
  const rows = [
    { name: "Automatic strategy", val: strat, color: C.gold },
    { name: "Your mix", val: passive, color: C.steel },
    { name: "S&P 500 (SPY)", val: spy, color: C.rust },
  ];
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 10, lineHeight: 1.4 }}>{plain}</div>
      {rows.map((r) => (
        <div key={r.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
          <span style={{ fontSize: 12, color: C.textDim, fontFamily: "'Inter',sans-serif" }}>{r.name}</span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, fontWeight: r.val === best ? 700 : 500, color: r.val === best ? r.color : C.text }}>
            {format(r.val)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function TSPTacticalDashboard() {
  const series = useMemo(() => buildSeries(), []);
  const lastIdx = series.length - 1;

  const [alloc, setAlloc] = useState({ C: 40, G: 25, S: 10, I: 10, F: 15 });
  const [startIdx, setStartIdx] = useState(0);
  const [endIdx, setEndIdx] = useState(lastIdx);
  const [showMethodology, setShowMethodology] = useState(false);
  const [logScale, setLogScale] = useState(true);
  const [showMetricsHelp, setShowMetricsHelp] = useState(true);

  const MIN_GAP = 24; // require at least 2 years so the numbers mean something
  const handleStart = (v) => setStartIdx(Math.min(v, endIdx - MIN_GAP));
  const handleEnd = (v) => setEndIdx(Math.max(v, startIdx + MIN_GAP));

  const allocTotal = alloc.C + alloc.G + alloc.S + alloc.I + alloc.F;
  const norm = useMemo(() => {
    const t = allocTotal || 1;
    return { C: alloc.C / t, G: alloc.G / t, S: alloc.S / t, I: alloc.I / t, F: alloc.F / t };
  }, [alloc, allocTotal]);

  // Strategy is computed on full history so its trend/vol read-outs are
  // never "cold" at the start of a user-chosen window, then sliced to view.
  const strategyMonthlyFull = useMemo(() => runTacticalStrategy(series, STRATEGY), [series]);

  const windowSeries = series.slice(startIdx, endIdx + 1);
  const gReturns = windowSeries.map((m) => m.gRet);
  const stratReturns = strategyMonthlyFull.slice(startIdx, endIdx + 1).map((m) => m.ret);
  const passiveReturns = windowSeries.map(
    (m) => norm.C * m.cRet + norm.G * m.gRet + norm.S * m.sRet + norm.I * m.iRet + norm.F * m.fRet
  );
  const spyReturns = windowSeries.map((m) => m.spyRet);

  const stratMetrics = useMemo(() => computeMetrics(stratReturns, gReturns), [stratReturns]);
  const passiveMetrics = useMemo(() => computeMetrics(passiveReturns, gReturns), [passiveReturns]);
  const spyMetrics = useMemo(() => computeMetrics(spyReturns, gReturns), [spyReturns]);

  const chartData = useMemo(() => {
    const START = 10000;
    return windowSeries.map((m, i) => ({
      label: m.label,
      year: m.year,
      Strategy: START * stratMetrics.path[i + 1],
      "Your mix": START * passiveMetrics.path[i + 1],
      "S&P 500": START * spyMetrics.path[i + 1],
    }));
  }, [windowSeries, stratMetrics, passiveMetrics, spyMetrics]);

  const ddData = useMemo(() => {
    let peakS = 1, peakP = 1, peakY = 1;
    return windowSeries.map((m, i) => {
      const s = stratMetrics.path[i + 1];
      const p = passiveMetrics.path[i + 1];
      const y = spyMetrics.path[i + 1];
      peakS = Math.max(peakS, s);
      peakP = Math.max(peakP, p);
      peakY = Math.max(peakY, y);
      return {
        label: m.label,
        StrategyDD: ((s - peakS) / peakS) * 100,
        MixDD: ((p - peakP) / peakP) * 100,
        SP500DD: ((y - peakY) / peakY) * 100,
      };
    });
  }, [windowSeries, stratMetrics, passiveMetrics, spyMetrics]);

  const span = endIdx - startIdx;
  const tickEvery = span > 180 ? 36 : span > 90 ? 24 : span > 48 ? 12 : 6;
  const tickIndices = useMemo(() => {
    const idxs = [];
    for (let i = 0; i < chartData.length; i += tickEvery) idxs.push(i);
    return idxs;
  }, [chartData, tickEvery]);

  const setFund = (key) => (v) => setAlloc((a) => ({ ...a, [key]: v }));

  const scrollToSubscribe = () => {
    const el = document.getElementById("subscribe-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100%", padding: "28px 20px 40px", fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        input[type=range]{-webkit-appearance:none;height:4px;background:${C.line};border-radius:2px;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;background:currentColor;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.25);cursor:pointer;}
        input[type=range]::-moz-range-thumb{width:15px;height:15px;border-radius:50%;background:currentColor;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.25);cursor:pointer;}
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 26, borderBottom: `1px solid ${C.line}`, paddingBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 6 }}>
            <span style={{ fontSize: 11, letterSpacing: 2, color: C.gold, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700 }}>
              TSP RETIREMENT SAVINGS EXPLORER
            </span>
            <button
              onClick={scrollToSubscribe}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: C.teal,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 20,
                padding: "8px 16px",
                fontFamily: "'Inter',sans-serif",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <Mail size={13} />
              Subscribe — $5/mo
            </button>
          </div>
          <h1 style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 32, margin: "4px 0 10px", letterSpacing: -0.3 }}>
            Would an "auto-pilot" have beaten just picking a mix and holding it?
          </h1>
          <p style={{ color: C.textDim, fontSize: 14.5, maxWidth: 780, lineHeight: 1.65, margin: 0 }}>
            This tool follows a simple automatic rule: when the stock market fund (C Fund) has
            been trending up, it invests there, sized down a bit when the market's been unusually
            bumpy. When the trend turns down, it moves everything to the safe G Fund until things
            recover. You can't change that rule — instead, use the sliders below to build your own
            "buy and hold" mix across all five TSP funds, pick the time period you care about, and
            see which approach actually came out ahead.
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: 18, marginBottom: 22 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Calendar size={15} color={C.gold} />
              <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3 }}>Time period to look at</span>
            </div>
            <DateSlider
              label="Start"
              value={startIdx}
              min={0}
              max={lastIdx}
              onChange={handleStart}
              dateText={series[startIdx].dateLabel}
              accent={C.gold}
            />
            <DateSlider
              label="End"
              value={endIdx}
              min={0}
              max={lastIdx}
              onChange={handleEnd}
              dateText={series[endIdx].dateLabel}
              accent={C.gold}
            />
            <p style={{ fontSize: 11.5, color: C.textDim, lineHeight: 1.5, marginTop: 4 }}>
              Data runs from {series[0].dateLabel} to {series[lastIdx].dateLabel}. Try a period
              that includes a downturn (like 2008 or 2022) to see how each approach handles bad
              years, not just good ones.
            </p>
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Scale size={15} color={C.steel} />
                <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3 }}>Build your own mix</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "'IBM Plex Mono',monospace",
                  color: Math.abs(allocTotal - 100) < 0.5 ? C.teal : C.textDim,
                  background: C.panel2,
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                sliders auto-scale to 100%
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 20 }}>
              <div>
                <AllocSlider fundKey="C" value={alloc.C} onChange={setFund("C")} normalizedPct={norm.C * 100} />
                <AllocSlider fundKey="S" value={alloc.S} onChange={setFund("S")} normalizedPct={norm.S * 100} />
                <AllocSlider fundKey="I" value={alloc.I} onChange={setFund("I")} normalizedPct={norm.I * 100} />
              </div>
              <div>
                <AllocSlider fundKey="F" value={alloc.F} onChange={setFund("F")} normalizedPct={norm.F * 100} />
                <AllocSlider fundKey="G" value={alloc.G} onChange={setFund("G")} normalizedPct={norm.G * 100} />
              </div>
            </div>
            <p style={{ fontSize: 11.5, color: C.textDim, lineHeight: 1.5, marginTop: 4 }}>
              This mix is rebalanced back to these percentages every month and never changes based
              on what the market is doing — it's the steady, "set it and forget it" option the
              automatic strategy is being measured against.
            </p>
          </div>
        </div>

        {/* Highlighted metrics explainer */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(169,121,12,0.09), rgba(169,121,12,0.02))",
            border: `1px solid rgba(169,121,12,0.35)`,
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 22,
            cursor: "pointer",
          }}
          onClick={() => setShowMetricsHelp((s) => !s)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <HelpCircle size={16} color={C.gold} />
              <span style={{ fontWeight: 700, fontSize: 14.5 }}>
                What do the numbers below actually mean?
              </span>
            </div>
            {showMetricsHelp ? <ChevronUp size={16} color={C.textDim} /> : <ChevronDown size={16} color={C.textDim} />}
          </div>
          {showMetricsHelp && (
            <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.75, color: "#3A342C" }}>
              Every number below is measured on the exact same time period, for all three
              approaches — so it's a fair, apples-to-apples comparison. Each one answers a
              different everyday question:
              <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
                <li style={{ marginBottom: 7 }}><b style={{ color: C.gold }}>Yearly growth (CAGR)</b> — on average, how much did the balance grow each year?</li>
                <li style={{ marginBottom: 7 }}><b style={{ color: C.gold }}>Worst drop (Max Drawdown)</b> — at the scariest point, how far did the balance fall from its previous high before recovering? This is the number that answers "how bad could it get?"</li>
                <li style={{ marginBottom: 7 }}><b style={{ color: C.gold }}>Sharpe ratio</b> — how much extra growth you got for how bumpy the ride was, overall. Higher means a smoother path to the same or better returns.</li>
                <li style={{ marginBottom: 7 }}><b style={{ color: C.gold }}>Sortino ratio</b> — similar to Sharpe, but it only counts the bumps that were <i>losses</i>. A portfolio that has big up-swings isn't penalized for those.</li>
                <li><b style={{ color: C.gold }}>Calmar ratio</b> — yearly growth divided by the single worst drop. A quick way to ask "was the growth worth the worst scare?"</li>
              </ul>
              <div style={{ marginTop: 10, color: C.textDim }}>
                Don't just chase the highest growth number — a portfolio that grew a little slower
                but never fell nearly as far is often the one that's easier to actually stick with.
                That's the trade-off the last three ratios are trying to capture.
              </div>
            </div>
          )}
        </div>

        {/* Metrics grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 22 }}>
          <MetricCard label="Yearly growth" plain="Average growth per year" strat={stratMetrics.cagr} passive={passiveMetrics.cagr} spy={spyMetrics.cagr} format={fmtPct} />
          <MetricCard label="Worst drop" plain="Biggest fall from a high point" strat={stratMetrics.maxDD} passive={passiveMetrics.maxDD} spy={spyMetrics.maxDD} format={fmtPct} higherIsBetter={true} />
          <MetricCard label="Sharpe ratio" plain="Growth vs. overall bumpiness" strat={stratMetrics.sharpe} passive={passiveMetrics.sharpe} spy={spyMetrics.sharpe} format={fmtRatio} />
          <MetricCard label="Sortino ratio" plain="Growth vs. bad bumps only" strat={stratMetrics.sortino} passive={passiveMetrics.sortino} spy={spyMetrics.sortino} format={fmtRatio} />
          <MetricCard label="Calmar ratio" plain="Growth vs. the worst scare" strat={stratMetrics.calmar} passive={passiveMetrics.calmar} spy={spyMetrics.calmar} format={fmtRatio} />
        </div>

        {/* Growth chart */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "20px 20px 8px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={15} color={C.gold} />
              <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3 }}>
                If you'd put in $10,000 — {series[startIdx].dateLabel} to {series[endIdx].dateLabel}
              </span>
            </div>
            <label style={{ fontSize: 11.5, color: C.textDim, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={logScale} onChange={(e) => setLogScale(e.target.checked)} />
              Even out the scale
            </label>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.line} strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="label"
                ticks={tickIndices.map((i) => chartData[i].label)}
                tick={{ fill: C.textDim, fontSize: 11, fontFamily: "IBM Plex Mono" }}
                axisLine={{ stroke: C.line }}
                tickLine={false}
              />
              <YAxis
                scale={logScale ? "log" : "linear"}
                domain={logScale ? ["auto", "auto"] : [0, "auto"]}
                tick={{ fill: C.textDim, fontSize: 11, fontFamily: "IBM Plex Mono" }}
                tickFormatter={(v) => "$" + Math.round(v).toLocaleString()}
                axisLine={{ stroke: C.line }}
                tickLine={false}
                width={70}
              />
              <Tooltip
                formatter={(v) => "$" + Math.round(v).toLocaleString()}
                contentStyle={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 6, fontSize: 12, fontFamily: "IBM Plex Mono" }}
                labelStyle={{ color: C.textDim }}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Inter" }} />
              <Line type="monotone" dataKey="Strategy" stroke={C.gold} dot={false} strokeWidth={2.25} />
              <Line type="monotone" dataKey="Your mix" stroke={C.steel} dot={false} strokeWidth={1.75} />
              <Line type="monotone" dataKey="S&P 500" stroke={C.rust} dot={false} strokeWidth={1.75} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Drawdown chart */}
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "20px 20px 8px", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Shield size={15} color={C.rust} />
            <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.3 }}>How far below its high point each option fell</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={ddData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={C.line} strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="label"
                ticks={tickIndices.map((i) => ddData[i].label)}
                tick={{ fill: C.textDim, fontSize: 10, fontFamily: "IBM Plex Mono" }}
                axisLine={{ stroke: C.line }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: C.textDim, fontSize: 10, fontFamily: "IBM Plex Mono" }}
                tickFormatter={(v) => v + "%"}
                axisLine={{ stroke: C.line }}
                tickLine={false}
                width={44}
              />
              <Tooltip
                formatter={(v) => v.toFixed(1) + "%"}
                contentStyle={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 6, fontSize: 12, fontFamily: "IBM Plex Mono" }}
                labelStyle={{ color: C.textDim }}
              />
              <Area type="monotone" dataKey="StrategyDD" stroke={C.gold} fill={C.gold} fillOpacity={0.16} strokeWidth={1.5} name="Strategy" />
              <Area type="monotone" dataKey="MixDD" stroke={C.steel} fill={C.steel} fillOpacity={0.1} strokeWidth={1} name="Your mix" />
              <Area type="monotone" dataKey="SP500DD" stroke={C.rust} fill={C.rust} fillOpacity={0.06} strokeWidth={1} name="S&P 500" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Methodology */}
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, padding: "14px 18px", cursor: "pointer", background: C.panel }} onClick={() => setShowMethodology((s) => !s)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Info size={14} color={C.textDim} />
              <span style={{ fontSize: 12.5, color: C.textDim }}>Where this data comes from</span>
            </div>
            {showMethodology ? <ChevronUp size={14} color={C.textDim} /> : <ChevronDown size={14} color={C.textDim} />}
          </div>
          {showMethodology && (
            <div style={{ marginTop: 10, fontSize: 12, color: C.textDim, lineHeight: 1.7 }}>
              The full history here runs from 2002 to 2026 because two of the five TSP funds
              (S and I) didn't exist before mid-2001 — starting in 2002 means all five can be
              compared fairly, side by side. The G Fund's month-by-month numbers are the real,
              published figures. For the C, S, I, and F Funds, only the real yearly totals were
              available, so each year's month-to-month path shown here is a reasonable
              stand-in shaped to that fund's typical bumpiness — but every year still ends at
              the fund's actual, published return. The S&P 500 line is modeled as very close to
              the C Fund, since the C Fund exists specifically to track that same index. This
              page is meant to help you understand how the trade-offs work, not to tell you what
              to actually do with your money — it isn't financial advice.
            </div>
          )}
        </div>

        {/* Subscribe section */}
        <div
          id="subscribe-section"
          style={{
            marginTop: 40,
            background: `linear-gradient(135deg, ${C.panel} 0%, ${C.panel2} 100%)`,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: "36px 40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: C.teal,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <Mail size={18} color="#FFFFFF" />
          </div>
          <h2 style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 24, margin: "0 0 8px", color: C.text }}>
            Get the monthly signal newsletter
          </h2>
          <p style={{ color: C.textDim, fontSize: 14, maxWidth: 460, margin: "0 auto 22px", lineHeight: 1.6 }}>
            Once a month, get a plain-language email with the current trend signal, the
            recommended allocation, and what changed since last time — no jargon, no noise.
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "baseline",
              gap: 4,
              marginBottom: 24,
            }}
          >
            <span style={{ fontFamily: "'Source Serif 4',serif", fontSize: 36, fontWeight: 700, color: C.text }}>$5</span>
            <span style={{ fontSize: 14, color: C.textDim }}>/ month</span>
          </div>
          {/* Replace this href with your actual Stripe Checkout / Payment Link URL */}
          <a
            href="https://buy.stripe.com/replace-with-your-checkout-link"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: C.teal,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 24,
              padding: "13px 30px",
              fontFamily: "'Inter',sans-serif",
              fontSize: 14.5,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.14)",
              textDecoration: "none",
            }}
          >
            <Mail size={15} />
            Subscribe — $5/month
          </a>
          <p style={{ fontSize: 11, color: C.textDim, marginTop: 16 }}>
            Cancel anytime. Informational only — not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
