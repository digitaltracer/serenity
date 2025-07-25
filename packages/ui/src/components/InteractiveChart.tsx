/**
 * Interactive Chart Component
 * Base component for creating interactive, responsive charts with hover effects, tooltips, and smooth animations
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Portal } from './Portal';

export interface ChartDataPoint {
  id: string;
  label: string;
  value: number;
  color?: string;
  date?: Date;
  metadata?: Record<string, any>;
  normalizedValue?: number;
  x?: number;
  y?: number;
}

export interface ChartTooltipData {
  x: number;
  y: number;
  title: string;
  content: string;
  color?: string;
}

interface InteractiveChartProps {
  data: ChartDataPoint[];
  type: 'line' | 'bar' | 'area' | 'pie' | 'heatmap';
  width?: number;
  height?: number;
  className?: string;
  showGrid?: boolean;
  showAxis?: boolean;
  showTooltip?: boolean;
  animationDuration?: number;
  colors?: string[];
  onDataPointClick?: (dataPoint: ChartDataPoint) => void;
  onDataPointHover?: (dataPoint: ChartDataPoint | null) => void;
  formatTooltip?: (dataPoint: ChartDataPoint) => { title: string; content: string };
  customRenderer?: (props: {
    data: ChartDataPoint[];
    width: number;
    height: number;
    hoveredPoint: ChartDataPoint | null;
  }) => React.ReactNode;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  type,
  width = 400,
  height = 300,
  className = '',
  showGrid = true,
  showAxis = true,
  showTooltip = true,
  animationDuration = 300,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'],
  onDataPointClick,
  onDataPointHover,
  formatTooltip,
  customRenderer,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [tooltipData, setTooltipData] = useState<ChartTooltipData | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  // Animation effect
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), animationDuration);
    return () => clearTimeout(timer);
  }, [data, animationDuration]);

  // Chart dimensions with margins
  const margins = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - margins.left - margins.right;
  const chartHeight = height - margins.top - margins.bottom;

  // Data processing
  const processedData = useMemo(() => {
    if (data.length === 0) return [];
    
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value), 0);
    const valueRange = maxValue - minValue || 1;

    return data.map((point, index) => {
      const normalizedValue = (point.value - minValue) / valueRange;
      return {
        ...point,
        color: point.color || colors[index % colors.length],
        normalizedValue,
        x: (index / Math.max(data.length - 1, 1)) * chartWidth,
        y: chartHeight - (normalizedValue * chartHeight),
      };
    });
  }, [data, chartWidth, chartHeight, colors]);

  // Handle mouse events
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - margins.left;
    const mouseY = event.clientY - rect.top - margins.top;

    // Find closest data point
    let closestPoint: ChartDataPoint | null = null;
    let minDistance = Infinity;

    processedData.forEach((point) => {
      if (point.x !== undefined && point.y !== undefined) {
        const distance = Math.sqrt(
          Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
        );
        if (distance < minDistance && distance < 30) {
          minDistance = distance;
          closestPoint = point;
        }
      }
    });

    if (closestPoint !== hoveredPoint) {
      setHoveredPoint(closestPoint);
      onDataPointHover?.(closestPoint);

      if (closestPoint && showTooltip) {
        const point = closestPoint as ChartDataPoint;
        const tooltip = formatTooltip 
          ? formatTooltip(point)
          : {
              title: point.label,
              content: `Value: ${point.value}`,
            };

        setTooltipData({
          x: event.clientX,
          y: event.clientY - 10,
          title: tooltip.title,
          content: tooltip.content,
          color: point.color,
        });
      } else {
        setTooltipData(null);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setTooltipData(null);
    onDataPointHover?.(null);
  };

  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (hoveredPoint) {
      onDataPointClick?.(hoveredPoint);
    }
  };

  // Render grid lines
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridLines = [];
    const numLines = 5;

    // Horizontal grid lines
    for (let i = 0; i <= numLines; i++) {
      const y = (i / numLines) * chartHeight;
      gridLines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={chartWidth}
          y2={y}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gray-200 dark:text-gray-700"
          opacity="0.5"
        />
      );
    }

    // Vertical grid lines
    for (let i = 0; i <= numLines; i++) {
      const x = (i / numLines) * chartWidth;
      gridLines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={chartHeight}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-gray-200 dark:text-gray-700"
          opacity="0.3"
        />
      );
    }

    return <g className="grid">{gridLines}</g>;
  };

  // Render axis
  const renderAxis = () => {
    if (!showAxis) return null;

    return (
      <g className="axis">
        {/* X-axis */}
        <line
          x1={0}
          y1={chartHeight}
          x2={chartWidth}
          y2={chartHeight}
          stroke="currentColor"
          strokeWidth="1"
          className="text-gray-300 dark:text-gray-600"
        />
        {/* Y-axis */}
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={chartHeight}
          stroke="currentColor"
          strokeWidth="1"
          className="text-gray-300 dark:text-gray-600"
        />
      </g>
    );
  };

  // Render line chart
  const renderLineChart = () => {
    if (processedData.length < 2) return null;

    const pathData = processedData
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    const areaPathData = `${pathData} L ${processedData[processedData.length - 1].x} ${chartHeight} L ${processedData[0].x} ${chartHeight} Z`;

    return (
      <g className="line-chart">
        {/* Area fill */}
        {type === 'area' && (
          <path
            d={areaPathData}
            fill="url(#areaGradient)"
            opacity="0.3"
            className="transition-all duration-300"
          />
        )}
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={colors[0]}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
          style={{
            strokeDasharray: isAnimating ? `${chartWidth * 2}` : 'none',
            strokeDashoffset: isAnimating ? `${chartWidth * 2}` : '0',
            transition: `stroke-dashoffset ${animationDuration}ms ease-out`,
          }}
        />
        
        {/* Data points */}
        {processedData.map((point, index) => (
          <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={hoveredPoint?.id === point.id ? 6 : 4}
            fill="white"
            stroke={point.color}
            strokeWidth="3"
            className="cursor-pointer transition-all duration-200 hover:r-6"
            style={{
              transform: isAnimating ? 'scale(0)' : 'scale(1)',
              transition: `transform ${animationDuration}ms ease-out ${index * 50}ms`,
            }}
          />
        ))}
      </g>
    );
  };

  // Render bar chart
  const renderBarChart = () => {
    const barWidth = chartWidth / processedData.length * 0.8;
    const barSpacing = chartWidth / processedData.length * 0.2;

    return (
      <g className="bar-chart">
        {processedData.map((point, index) => {
          const barHeight = point.normalizedValue * chartHeight;
          const x = point.x - barWidth / 2;
          const y = chartHeight - barHeight;

          return (
            <rect
              key={point.id}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={point.color}
              className="cursor-pointer transition-all duration-200 hover:opacity-80"
              opacity={hoveredPoint?.id === point.id ? 0.8 : 1}
              style={{
                transform: isAnimating ? 'scaleY(0)' : 'scaleY(1)',
                transformOrigin: 'bottom',
                transition: `transform ${animationDuration}ms ease-out ${index * 50}ms`,
              }}
            />
          );
        })}
      </g>
    );
  };

  // Render chart based on type
  const renderChart = () => {
    if (customRenderer) {
      return customRenderer({
        data: processedData,
        width: chartWidth,
        height: chartHeight,
        hoveredPoint,
      });
    }

    switch (type) {
      case 'line':
      case 'area':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      default:
        return renderLineChart();
    }
  };

  if (data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-sm">No data available</div>
          <div className="text-xs mt-1">Add some data to see the chart</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <defs>
          {/* Gradient for area charts */}
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors[0]} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        <g transform={`translate(${margins.left}, ${margins.top})`}>
          {renderGrid()}
          {renderAxis()}
          {renderChart()}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltipData && showTooltip && (
        <Portal>
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 pointer-events-none"
            style={{
              left: tooltipData.x + 10,
              top: tooltipData.y - 10,
              transform: 'translateY(-100%)',
            }}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {tooltipData.title}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {tooltipData.content}
            </div>
            {tooltipData.color && (
              <div 
                className="w-2 h-2 rounded-full mt-2"
                style={{ backgroundColor: tooltipData.color }}
              />
            )}
          </div>
        </Portal>
      )}
    </div>
  );
};

// Utility function to create chart data
export const createChartData = (
  data: Array<{ label: string; value: number; date?: Date; [key: string]: any }>,
  options?: { colors?: string[] }
): ChartDataPoint[] => {
  return data.map((item, index) => ({
    id: `data-${index}`,
    label: item.label,
    value: item.value,
    date: item.date,
    color: options?.colors?.[index % (options.colors.length)] || undefined,
    metadata: { ...item },
  }));
};