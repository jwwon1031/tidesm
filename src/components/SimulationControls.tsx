import React from 'react';
import { SimulationParams } from '../types/tide';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  StepForward,
  Clock,
} from 'lucide-react';

interface SimulationControlsProps {
  params: SimulationParams;
  onUpdateParams: (partial: Partial<SimulationParams>) => void;
  onStepTime: (deltaHours: number) => void;
  onResetTime: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  params,
  onUpdateParams,
  onStepTime,
  onResetTime,
}) => {
  const currentDays = Math.floor(params.timeHours / 24);
  const currentHours = Math.floor(params.timeHours % 24);
  const currentMinutes = Math.floor((params.timeHours * 60) % 60);

  const speedOptions = [0.25, 0.5, 1, 2, 5, 12, 24];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
      {/* Play/Pause & Step Controls */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start">
        <button
          type="button"
          onClick={() => onUpdateParams({ isPlaying: !params.isPlaying })}
          className={`flex items-center justify-center h-10 px-4 gap-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
            params.isPlaying
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950'
          }`}
        >
          {params.isPlaying ? (
            <>
              <Pause className="h-4 w-4 fill-current" />
              <span>일시정지</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-current" />
              <span>재생</span>
            </>
          )}
        </button>

        {/* Step backward 1 hour */}
        <button
          type="button"
          onClick={() => onStepTime(-1)}
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
          title="-1시간"
        >
          <Rewind className="h-4 w-4" />
        </button>

        {/* Step forward 15 mins */}
        <button
          type="button"
          onClick={() => onStepTime(0.25)}
          className="flex items-center justify-center h-9 px-2.5 rounded-lg border border-slate-800 bg-slate-900 text-[11px] font-mono text-slate-300 hover:bg-slate-800 transition-colors"
          title="+15분 전진"
        >
          +15분
        </button>

        {/* Step forward 1 hour */}
        <button
          type="button"
          onClick={() => onStepTime(1)}
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-colors"
          title="+1시간"
        >
          <StepForward className="h-4 w-4" />
        </button>

        {/* Step forward 1 day */}
        <button
          type="button"
          onClick={() => onStepTime(24)}
          className="flex items-center justify-center h-9 px-2.5 rounded-lg border border-slate-800 bg-slate-900 text-[11px] font-mono text-slate-300 hover:bg-slate-800 transition-colors"
          title="+1일 (24시간)"
        >
          +1일
        </button>

        {/* Reset */}
        <button
          type="button"
          onClick={onResetTime}
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="시간 초기화"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Speed Multiplier Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
        <span className="text-[11px] font-medium text-slate-400 px-1.5 flex items-center gap-1">
          <FastForward className="h-3 w-3" /> 속도
        </span>
        {speedOptions.map((speed) => (
          <button
            key={speed}
            type="button"
            onClick={() => onUpdateParams({ speedMultiplier: speed })}
            className={`px-2 py-1 text-[11px] font-mono rounded-lg transition-colors ${
              params.speedMultiplier === speed
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Synchronized Time Scrubber & Digital Readout */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          <div className="font-mono text-xs font-semibold text-slate-200 tabular-nums">
            <span className="text-cyan-400">{currentDays + 1}일차</span>{' '}
            <span>{String(currentHours).padStart(2, '0')}시</span>{' '}
            <span className="text-slate-400">{String(currentMinutes).padStart(2, '0')}분</span>
          </div>
        </div>

        {/* Range slider for time (0h to 720h = 30 days) */}
        <input
          type="range"
          min={0}
          max={720}
          step={0.25}
          value={params.timeHours % 720}
          onChange={(e) => {
            const newHours = parseFloat(e.target.value);
            onUpdateParams({ timeHours: newHours });
          }}
          className="w-28 sm:w-36 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          title="시간 탐색"
        />
      </div>
    </div>
  );
};
