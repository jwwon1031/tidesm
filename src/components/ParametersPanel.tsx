import React from 'react';
import { SimulationParams, TideState } from '../types/tide';
import {
  Compass,
  MapPin,
  Moon,
  Sun,
  Waves,
  Info,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface ParametersPanelProps {
  params: SimulationParams;
  tideState: TideState;
  onUpdateParams: (partial: Partial<SimulationParams>) => void;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  params,
  tideState,
  onUpdateParams,
}) => {
  const latitudePresets = [
    { label: '적도 (0°)', lat: 0 },
    { label: '한국 서해안 (37.5°)', lat: 37.5 },
    { label: '고위도 해역 (65°)', lat: 65 },
    { label: '북극 (90°)', lat: 90 },
  ];

  const declinationPresets = [
    { label: '0° (적도면/대칭)', decl: 0 },
    { label: '18.5° (평균)', decl: 18.5 },
    { label: '28.5° (최대 경사)', decl: 28.5 },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-100">조석 변수 조절 패널</h2>
        </div>
        <span className="text-[11px] font-mono text-cyan-400/80">Interactive Parameters</span>
      </div>

      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Card 1: Current Tide Height */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 mb-0.5">현재 관측소 조위</div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold text-cyan-300 tabular-nums">
              {tideState.currentHeight >= 0 ? '+' : ''}
              {tideState.currentHeight.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">m</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {tideState.isFlooding ? '▲ 밀물(창조)' : tideState.isEbbing ? '▼ 썰물(낙조)' : '● 정조'}
          </div>
        </div>

        {/* Card 2: Tidal Range */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 mb-0.5">당일 조차 (만조-간조)</div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold text-amber-300 tabular-nums">
              {tideState.tidalRange.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">m</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {tideState.tideCategoryName}
          </div>
        </div>

        {/* Card 3: Diurnal Inequality */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 mb-0.5">일조부등 (만조 높이차)</div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold text-indigo-300 tabular-nums">
              {tideState.diurnalInequality.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400">m</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {tideState.diurnalInequality < 0.1
              ? '완전 반일주조'
              : tideState.diurnalInequality > 2.0
              ? '일주조 우세'
              : '혼합조 (일조부등)'}
          </div>
        </div>

        {/* Card 4: Tidal Period */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
          <div className="text-[10px] text-slate-400 mb-0.5">조석 주기 (태음일)</div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-mono font-bold text-emerald-300 tabular-nums">
              12시간 25분
            </span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">
            매일 약 50분씩 지연
          </div>
        </div>
      </div>

      {/* Control 1: Observer Latitude Slider */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
            <span>관측자 위도 (Latitude, φ)</span>
          </label>
          <span className="font-mono text-xs text-amber-300 font-bold tabular-nums">
            {params.latitude > 0 ? `북위 ${params.latitude.toFixed(1)}°` : params.latitude < 0 ? `남위 ${Math.abs(params.latitude).toFixed(1)}°` : '적도 0.0°'}
          </span>
        </div>

        <input
          type="range"
          min={-90}
          max={90}
          step={0.5}
          value={params.latitude}
          onChange={(e) => onUpdateParams({ latitude: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        {/* Latitude preset quick buttons */}
        <div className="flex flex-wrap gap-1">
          {latitudePresets.map((p) => (
            <button
              key={p.lat}
              type="button"
              onClick={() => onUpdateParams({ latitude: p.lat })}
              className={`px-2 py-1 text-[11px] rounded-md transition-colors whitespace-nowrap shrink-0 ${
                Math.abs(params.latitude - p.lat) < 0.5
                  ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 font-medium'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Control 2: Lunar Declination Slider */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5 text-cyan-400" />
            <span>달의 적위 경사 (Declination, δ)</span>
          </label>
          <span className="font-mono text-xs text-cyan-300 font-bold tabular-nums">
            {params.moonDeclination.toFixed(1)}°
          </span>
        </div>

        <input
          type="range"
          min={-28.5}
          max={28.5}
          step={0.5}
          value={params.moonDeclination}
          onChange={(e) => onUpdateParams({ moonDeclination: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        {/* Declination presets */}
        <div className="flex flex-wrap gap-1">
          {declinationPresets.map((p) => (
            <button
              key={p.decl}
              type="button"
              onClick={() => onUpdateParams({ moonDeclination: p.decl })}
              className={`px-2 py-1 text-[11px] rounded-md transition-colors whitespace-nowrap shrink-0 ${
                Math.abs(params.moonDeclination - p.decl) < 0.5
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40 font-medium'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Control 3: Moon Distance Ratio Slider */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-indigo-400" />
            <span>달-지구 거리 비율 (슈퍼문 효과)</span>
          </label>
          <span className="font-mono text-xs text-indigo-300 font-bold tabular-nums">
            {(params.moonDistanceRatio * 100).toFixed(0)}%
          </span>
        </div>

        <input
          type="range"
          min={0.85}
          max={1.15}
          step={0.01}
          value={params.moonDistanceRatio}
          onChange={(e) => onUpdateParams({ moonDistanceRatio: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-500">
          <span>근지점 0.85 (슈퍼문 / 기조력 +60%)</span>
          <span>원지점 1.15 (미니문)</span>
        </div>
      </div>

      {/* Control 4: Sun Tide Toggle */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4 text-amber-400" />
          <div>
            <div className="text-xs font-semibold text-slate-200">태양 기조력 활성화</div>
            <div className="text-[10px] text-slate-400">사리(대조)와 조금(소조) 합성</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onUpdateParams({ sunActive: !params.sunActive })}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            params.sunActive ? 'bg-cyan-500' : 'bg-slate-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              params.sunActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Educational Callout box */}
      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed space-y-1">
        <div className="font-semibold text-slate-200 flex items-center gap-1">
          <Info className="h-3.5 w-3.5 text-cyan-400" />
          <span>핵심 과학 포인트</span>
        </div>
        <div>
          • 기조력은 거리의 세제곱에 반비례($F \propto 1/R^3$)하므로, 태양이 달보다 질량이 2,700만 배 커도 달의 기조력이 약 2.17배 더 셉니다.
        </div>
        <div>
          • 달의 적위(δ)가 0°이면 완벽한 반일주조, 적위가 커질수록 두 만조의 높이가 다른 일조부등이 뚜렷해집니다.
        </div>
      </div>
    </div>
  );
};
