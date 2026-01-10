"use client";

import { useState } from "react";

interface DataPoint {
  month: string;
  value: number;
}

interface InteractiveAreaChartProps {
  data: DataPoint[];
  title: string;
  description?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  color?: string;
}

export default function InteractiveAreaChart({
  data,
  title,
  description,
  valuePrefix = "",
  valueSuffix = "",
  color = "#3b82f6"
}: InteractiveAreaChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        <div className="mt-4 flex items-center justify-center h-[200px] text-sm text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 200;
  const chartWidth = 100;
  const padding = { top: 20, right: 10, bottom: 30, left: 10 };

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right);
    const y = padding.top + (1 - d.value / maxValue) * (chartHeight - padding.top - padding.bottom);
    return { x, y, value: d.value, month: d.month };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        {activeIndex !== null && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {valuePrefix}{data[activeIndex].value.toLocaleString()}{valueSuffix}
            </div>
            <div className="text-xs text-gray-500">{data[activeIndex].month}</div>
          </div>
        )}
      </div>

      <div className="mt-6 relative" style={{ height: `${chartHeight}px` }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <g className="text-gray-200">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding.left}
                y1={padding.top + ratio * (chartHeight - padding.top - padding.bottom)}
                x2={chartWidth - padding.right}
                y2={padding.top + ratio * (chartHeight - padding.top - padding.bottom)}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            ))}
          </g>

          {/* Area fill */}
          <path
            d={areaD}
            fill={`url(#gradient-${title})`}
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r={activeIndex === i ? "4" : "0"}
                fill="white"
                stroke={color}
                strokeWidth="2"
                className="transition-all duration-200"
              />
            </g>
          ))}

          {/* Invisible hover areas */}
          {points.map((point, i) => (
            <rect
              key={i}
              x={i === 0 ? 0 : (point.x + points[i - 1].x) / 2}
              y={0}
              width={i === 0 ? (points[1].x - point.x) / 2 : i === points.length - 1 ? chartWidth - (point.x + points[i - 1].x) / 2 : (points[i + 1].x - points[i - 1].x) / 2}
              height={chartHeight}
              fill="transparent"
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              className="cursor-pointer"
            />
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-500">
          {data.map((d, i) => (
            <span key={i} className={activeIndex === i ? "font-medium text-gray-900" : ""}>
              {d.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
