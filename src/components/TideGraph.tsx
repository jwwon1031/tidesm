import React, { useEffect, useRef, useState } from 'react';
import { SimulationParams, TideDataPoint, TideState } from '../types/tide';
import { generateTideGraphData } from '../utils/tidePhysics';
import { LineChart, Clock, Eye, Layers } from 'lucide-react';

interface TideGraphProps {
  params: SimulationParams;
  tideState: TideState;
  onSeekTime: (timeHours: number) => void;
}

export const TideGraph: React.FC<TideGraphProps> = ({
  params,
  tideState,
  onSeekTime,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [windowHours, setWindowHours] = useState<number>(48); // default 48 hours
  const [showComponents, setShowComponents] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; time: number; height: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Dark slate background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Generate graph dataset centered or following current time
    // In window of windowHours: start from params.timeHours - windowHours * 0.4 to params.timeHours + windowHours * 0.6
    const startTime = params.timeHours - windowHours * 0.4;
    const stepHours = windowHours > 100 ? 0.5 : 0.1;
    const data = generateTideGraphData(params.timeHours + windowHours * 0.1, windowHours, stepHours, params);

    // Padding inside canvas
    const padLeft = 52;
    const padRight = 32;
    const padTop = 28;
    const padBottom = 36;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Y Axis scaling (-4.5m to +4.5m)
    const maxY = 4.2;
    const minY = -4.2;
    const yScale = (h: number) => padTop + plotH * (1 - (h - minY) / (maxY - minY));
    const xScale = (t: number) => padLeft + ((t - startTime) / windowHours) * plotW;

    // 1. Draw Grid lines & zero axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Horizontal Y grid lines every 1m
    for (let h = -4; h <= 4; h += 1) {
      const y = yScale(h);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = h === 0 ? '#94a3b8' : '#475569';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${h > 0 ? '+' : ''}${h}m`, padLeft - 8, y + 3);
    }

    // Mean Sea Level (0m) highlight line
    const zeroY = yScale(0);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(width - padRight, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#64748b';
    ctx.font = '9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('평균 해수면 (MSL 0.0m)', padLeft + 6, zeroY - 5);

    // Vertical Time grid lines
    const timeStep = windowHours > 100 ? 72 : windowHours > 30 ? 6 : 3;
    const startTick = Math.floor(startTime / timeStep) * timeStep;
    for (let t = startTick; t <= startTime + windowHours; t += timeStep) {
      const x = xScale(t);
      if (x < padLeft || x > width - padRight) continue;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();

      // Time label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const day = Math.floor(t / 24) + 1;
      const hour = Math.floor(t % 24);
      const label = windowHours > 100 ? `${day}일` : `${day}일 ${hour}시`;
      ctx.fillText(label, x, height - padBottom + 16);
    }

    // 2. Optional: Draw Component Curves (Lunar & Solar)
    if (showComponents && params.sunActive) {
      // Solar Tide Curve (amber)
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = xScale(data[i].timeHours);
        const y = yScale(data[i].solarHeight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Lunar Tide Curve (indigo)
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = xScale(data[i].timeHours);
        const y = yScale(data[i].lunarHeight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 3. Draw Water Area Fill under curve
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = xScale(data[i].timeHours);
      const y = yScale(data[i].totalHeight);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    const lastX = xScale(data[data.length - 1].timeHours);
    ctx.lineTo(lastX, yScale(minY));
    ctx.lineTo(xScale(data[0].timeHours), yScale(minY));
    ctx.closePath();

    const areaGrad = ctx.createLinearGradient(0, padTop, 0, height - padBottom);
    areaGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
    areaGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.08)');
    areaGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // 4. Draw Main Total Tide Curve
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = xScale(data[i].timeHours);
      const y = yScale(data[i].totalHeight);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 5. Mark High Tides and Low Tides
    data.forEach((pt) => {
      const x = xScale(pt.timeHours);
      if (x < padLeft || x > width - padRight) return;
      const y = yScale(pt.totalHeight);

      if (pt.isHighTide) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (windowHours <= 72) {
          ctx.fillStyle = '#fca5a5';
          ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`만조 ${pt.totalHeight.toFixed(1)}m`, x, y - 8);
        }
      } else if (pt.isLowTide) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (windowHours <= 72) {
          ctx.fillStyle = '#93c5fd';
          ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`간조 ${pt.totalHeight.toFixed(1)}m`, x, y + 14);
        }
      }
    });

    // 6. Draw Current Time Cursor Line (Synchronized with simulation)
    const currentX = xScale(params.timeHours);
    if (currentX >= padLeft && currentX <= width - padRight) {
      const currentY = yScale(tideState.currentHeight);

      // Vertical tracking bar
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(currentX, padTop);
      ctx.lineTo(currentX, height - padBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current Point Pulsing Indicator
      ctx.beginPath();
      ctx.arc(currentX, currentY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Live readout tag above current point
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(currentX - 44, currentY - 32, 88, 22, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `현재: ${tideState.currentHeight >= 0 ? '+' : ''}${tideState.currentHeight.toFixed(2)}m`,
        currentX,
        currentY - 18
      );
    }

    // 7. Hover tooltip
    if (hoveredPoint) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hoveredPoint.x, padTop);
      ctx.lineTo(hoveredPoint.x, height - padBottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [params, tideState, windowHours, showComponents, hoveredPoint]);

  // Handle canvas click to seek time
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const padLeft = 52;
    const padRight = 32;
    const plotW = rect.width - padLeft - padRight;

    if (clickX >= padLeft && clickX <= rect.width - padRight) {
      const startTime = params.timeHours - windowHours * 0.4;
      const targetTime = startTime + ((clickX - padLeft) / plotW) * windowHours;
      onSeekTime(Math.max(0, targetTime));
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Graph Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <LineChart className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-xs text-slate-100 flex items-center gap-2">
              <span>실시간 조위 곡선 (Sea Level Curve)</span>
              <span className="text-[11px] font-mono text-cyan-400 font-normal">
                {tideState.isFlooding ? '▲ 밀물(창조) 진행 중' : tideState.isEbbing ? '▼ 썰물(낙조) 진행 중' : '정조(Slack Water)'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              클릭하여 원하는 시점으로 탐색할 수 있습니다
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Component curve toggle */}
          {params.sunActive && (
            <button
              type="button"
              onClick={() => setShowComponents(!showComponents)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                showComponents
                  ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>성분 분해 (달/태양)</span>
            </button>
          )}

          {/* Time Window Buttons */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setWindowHours(24)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                windowHours === 24
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              24시간 (1일)
            </button>
            <button
              type="button"
              onClick={() => setWindowHours(48)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                windowHours === 48
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              48시간 (2일)
            </button>
            <button
              type="button"
              onClick={() => setWindowHours(720)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                windowHours === 720
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30일 (삭망월/포락선)
            </button>
          </div>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="relative flex-1 w-full min-h-[220px] sm:min-h-[250px]">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block cursor-pointer"
        />

        {/* Legend */}
        <div className="absolute top-2.5 right-3 flex items-center gap-3 text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/80 backdrop-blur-sm pointer-events-none">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
            <span className="text-cyan-300 font-medium">합성 조위</span>
          </div>
          {showComponents && params.sunActive && (
            <>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-indigo-400 inline-block" />
                <span className="text-indigo-300">달 성분</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
                <span className="text-amber-300">태양 성분</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
