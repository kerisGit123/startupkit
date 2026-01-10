"use client";

import { useMemo, useState } from "react";

interface DataPoint {
  month: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}

export default function AreaChart({ 
  data, 
  height = 200, 
  color = "#3b82f6",
  showGrid = true,
  valuePrefix = "",
  valueSuffix = ""
}: AreaChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const { path, area, points } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: "", area: "", points: [] };
    }

    const values = data.map(d => d.value);
    const max = Math.max(...values, 1);
    const width = 100;
    const padding = 10;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    const stepX = chartWidth / (data.length - 1 || 1);

    const chartPoints = data.map((d, i) => ({
      x: padding + i * stepX,
      y: padding + chartHeight - (d.value / max) * chartHeight,
      value: d.value,
      month: d.month,
    }));

    const pathD = chartPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    const areaD = `${pathD} L ${chartPoints[chartPoints.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    return {
      path: pathD,
      area: areaD,
      points: chartPoints,
    };
  }, [data, height]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {showGrid && (
          <g className="opacity-10">
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y * height / 100}
                x2="100"
                y2={y * height / 100}
                stroke="currentColor"
                strokeWidth="0.5"
              />
            ))}
          </g>
        )}

        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <path
          d={area}
          fill={`url(#gradient-${color})`}
          className="transition-all duration-300"
        />

        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill={color}
              className="transition-all duration-300 hover:r-2"
            />
          </g>
        ))}
      </svg>

      <div className="flex justify-between mt-2 px-2 text-xs text-gray-500">
        {data.map((d, i) => (
          <span key={i} className="text-center">
            {d.month}
          </span>
        ))}
      </div>
    </div>
  );
}
