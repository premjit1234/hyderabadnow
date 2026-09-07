"use client";

import { useState } from "react";

type DayPoint = { day: string; n: number };

const WIDTH = 700;
const HEIGHT = 220;
const PAD_LEFT = 36;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;
const BAR_MAX_WIDTH = 24;
const BAR_RADIUS = 4;

/** Rounds a chart's max value up to a "clean" gridline value (nice numbers:
 * 1/2/5 x a power of ten), so the y-axis never shows an ugly max like 137. */
function niceMax(value: number) {
  if (value <= 0) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** A rect path with rounded top corners and a square baseline — the "column"
 * mark spec (4px rounded data-end, square at the baseline) that plain SVG
 * <rect rx> can't express, since rx rounds all four corners. */
function roundedTopBarPath(x: number, yTop: number, width: number, height: number, radius: number) {
  if (height <= 0) return "";
  const r = Math.min(radius, width / 2, height);
  const yBottom = yTop + height;
  return `M${x},${yBottom} L${x},${yTop + r} Q${x},${yTop} ${x + r},${yTop} L${x + width - r},${yTop} Q${x + width},${yTop} ${x + width},${yTop + r} L${x + width},${yBottom} Z`;
}

function formatDay(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", ...opts });
}

// A single-series (page views) daily bar chart — no legend, per dataviz
// convention, since one color already reads as "the thing the title names".
// Hover/focus on any bar's full-height hit area shows the exact date + count.
export default function DailyViewsChart({ series }: { series: DayPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = niceMax(Math.max(1, ...series.map((d) => d.n)));
  const chartWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const chartHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slotWidth = chartWidth / series.length;
  const barWidth = Math.min(BAR_MAX_WIDTH, slotWidth - 6);

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Daily page views, last 14 days">
        {gridSteps.map((frac) => {
          const y = PAD_TOP + chartHeight * (1 - frac);
          return (
            <g key={frac}>
              <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke="#e7e5e4" strokeWidth={1} />
              <text x={PAD_LEFT - 6} y={y} textAnchor="end" dominantBaseline="middle" className="fill-stone-400" fontSize={9}>
                {Math.round(max * frac).toLocaleString("en-IN")}
              </text>
            </g>
          );
        })}

        {series.map((d, i) => {
          const slotX = PAD_LEFT + i * slotWidth;
          const barX = slotX + (slotWidth - barWidth) / 2;
          const barHeight = (d.n / max) * chartHeight;
          const barY = PAD_TOP + chartHeight - barHeight;
          const isHovered = hovered === i;
          const showLabel = series.length <= 10 || i % 2 === 0 || i === series.length - 1;

          return (
            <g key={d.day}>
              <path
                d={roundedTopBarPath(barX, barY, barWidth, barHeight, BAR_RADIUS)}
                fill={isHovered ? "#4338ca" : "#4f46e5"}
              />
              {showLabel && (
                <text
                  x={slotX + slotWidth / 2}
                  y={HEIGHT - PAD_BOTTOM + 14}
                  textAnchor="middle"
                  className="fill-stone-400"
                  fontSize={9}
                >
                  {formatDay(d.day, { day: "numeric", month: "short" })}
                </text>
              )}
              {/* Full-slot, full-height hit area — bigger than the bar itself
                  so a short/zero bar is still easy to hover or tab to. */}
              <rect
                x={slotX}
                y={PAD_TOP}
                width={slotWidth}
                height={chartHeight}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${formatDay(d.day, { day: "numeric", month: "long", year: "numeric" })}: ${d.n} views`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
              />
            </g>
          );
        })}
      </svg>

      {hovered !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-y-full whitespace-nowrap rounded-md bg-stone-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{
            left: `${((PAD_LEFT + (hovered + 0.5) * slotWidth) / WIDTH) * 100}%`,
            // Center over the bar, except for the first/last couple of bars
            // where a full -50% shift would push the tooltip off the chart's
            // edge — clamp those to hug the near edge instead.
            transform:
              hovered < 2 ? "translateY(-100%)" : hovered > series.length - 3 ? "translate(-100%, -100%)" : "translate(-50%, -100%)",
          }}
        >
          <p className="font-semibold">{series[hovered].n.toLocaleString("en-IN")} views</p>
          <p className="text-stone-300">{formatDay(series[hovered].day, { weekday: "short", day: "numeric", month: "short" })}</p>
        </div>
      )}
    </div>
  );
}
