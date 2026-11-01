import React from 'react';

interface SparklineChartProps {
  data: number[];
  maxVal?: number;
  height?: number;
  color?: string;
  unit?: string;
}

export function SparklineChart({
  data,
  maxVal,
  height = 54,
  unit = '%',
}: SparklineChartProps) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-[10px] text-muted-foreground font-mono">
        Collecting stream data...
      </div>
    );
  }

  const computedMax = maxVal || Math.max(...data, 1);
  const width = 260;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const clamped = Math.max(0, Math.min(val, computedMax));
    const y = height - paddingY - (clamped / computedMax) * usableHeight;
    return { x, y };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    const prev = points[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx.toFixed(1)} ${prev.y.toFixed(1)}, ${cx.toFixed(1)} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
  const lastPoint = points[points.length - 1];

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Fill Area */}
        <path d={areaD} fill="url(#sparkGradient)" className="text-foreground" />

        {/* Stroke Line */}
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="text-foreground/90"
        />

        {/* Pulse beacon at the latest point */}
        {lastPoint && (
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="3"
            fill="currentColor"
            className="text-foreground animate-pulse"
          />
        )}
      </svg>
      <div className="absolute top-0 right-0 text-[10px] font-mono text-muted-foreground/70 pointer-events-none">
        Peak: {computedMax.toFixed(0)}{unit}
      </div>
    </div>
  );
}

export interface MultiWaveSeries {
  id: string;
  name: string;
  data: number[];
  color: string;       // Hex or CSS color for stroke (e.g. '#34d399')
  fillColor?: string;  // Hex for gradient fill stop
  dashed?: boolean;
}

interface MultiWaveChartProps {
  series: MultiWaveSeries[];
  height?: number;
  unit?: string;
}

export function MultiWaveChart({
  series,
  height = 54,
  unit = ' KB/s',
}: MultiWaveChartProps) {
  const hasData = series.some((s) => s.data && s.data.length >= 2);
  if (!hasData) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-[10px] text-muted-foreground font-mono">
        Collecting stream data...
      </div>
    );
  }

  const allValues = series.flatMap((s) => s.data || []);
  const computedMax = Math.max(...allValues, 1);
  const width = 280;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          {series.map((s, idx) => {
            const gradId = `multiGrad-${s.id || idx}`;
            const fillCol = s.fillColor || s.color;
            return (
              <linearGradient key={gradId} id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillCol} stopOpacity="0.28" />
                <stop offset="100%" stopColor={fillCol} stopOpacity="0.0" />
              </linearGradient>
            );
          })}
        </defs>

        {series.map((s, sIdx) => {
          if (!s.data || s.data.length < 2) return null;
          const points = s.data.map((val, idx) => {
            const x = (idx / (s.data.length - 1)) * width;
            const clamped = Math.max(0, Math.min(val, computedMax));
            const y = height - paddingY - (clamped / computedMax) * usableHeight;
            return { x, y };
          });

          const pathD = points.reduce((acc, pt, i) => {
            if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
            const prev = points[i - 1];
            const cx = (prev.x + pt.x) / 2;
            return `${acc} C ${cx.toFixed(1)} ${prev.y.toFixed(1)}, ${cx.toFixed(1)} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
          }, '');

          const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
          const lastPoint = points[points.length - 1];

          return (
            <g key={`series-${s.id || sIdx}`}>
              {/* Fill Area */}
              <path d={areaD} fill={`url(#multiGrad-${s.id || sIdx})`} />

              {/* Stroke Line */}
              <path
                d={pathD}
                fill="none"
                stroke={s.color}
                strokeWidth="1.8"
                strokeDasharray={s.dashed ? '4 3' : undefined}
                className="opacity-95"
              />

              {/* Pulse beacon at the latest point */}
              {lastPoint && (
                <circle
                  cx={lastPoint.x}
                  cy={lastPoint.y}
                  r="3.2"
                  fill={s.color}
                  className="animate-pulse"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute top-0 right-0 text-[10px] font-mono text-muted-foreground/75 pointer-events-none">
        Peak: {computedMax >= 1024 ? `${(computedMax / 1024).toFixed(1)} MB/s` : `${computedMax.toFixed(0)}${unit}`}
      </div>
    </div>
  );
}

interface RadialGaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function RadialGauge({
  value,
  max = 100,
  size = 120,
  strokeWidth,
  label = '%',
}: RadialGaugeProps) {
  const actualStroke = strokeWidth ?? Math.max(8, Math.round(size * 0.078));
  const radius = (size - actualStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (percentage / 100) * circumference;

  const isLarge = size >= 136;
  const isMedium = size >= 108;

  return (
    <div className="flex items-center justify-center py-0.5">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="text-muted/40"
            strokeWidth={actualStroke}
            stroke="currentColor"
            fill="transparent"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="text-foreground transition-all duration-500 ease-out"
            strokeWidth={actualStroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className={`font-mono font-bold tracking-tight text-foreground leading-none ${
            isLarge ? 'text-3xl' : isMedium ? 'text-2xl' : 'text-base'
          }`}>
            {Number.isInteger(value) && max > 100 ? value : value.toFixed(1)}
          </span>
          <span className={`font-mono uppercase tracking-wider text-muted-foreground ${
            isLarge ? 'text-xs mt-1' : isMedium ? 'text-[11px] mt-1' : 'text-[9px] -mt-0.5'
          }`}>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

interface SegmentedBlocksProps {
  value: number;
  max?: number;
  segments?: number;
}

export function SegmentedBlocks({
  value,
  max = 100,
  segments = 14,
}: SegmentedBlocksProps) {
  const filledCount = Math.round(Math.min(1, Math.max(0, value / max)) * segments);

  return (
    <div className="flex items-center gap-1 w-full pt-1">
      {Array.from({ length: segments }).map((_, i) => {
        const isFilled = i < filledCount;
        return (
          <div
            key={i}
            className={`h-3 flex-1 rounded-xs transition-colors duration-200 ${
              isFilled ? 'bg-foreground' : 'bg-muted/60'
            }`}
          />
        );
      })}
    </div>
  );
}
