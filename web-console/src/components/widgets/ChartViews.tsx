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
  size = 80,
  strokeWidth = 7,
  label = '%',
}: RadialGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center justify-center py-1">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="text-muted"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="text-foreground transition-all duration-500 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-sm font-bold tracking-tight text-foreground">
            {value.toFixed(1)}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground -mt-0.5">{label}</span>
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
