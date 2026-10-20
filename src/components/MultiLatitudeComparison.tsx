import React, { useState, useEffect, useRef } from 'react';
import { LatitudeTarget, SimulationParams } from '../types/tide';
import {
  calculateTideHeightAtTime,
  DEFAULT_COMPARISON_LATITUDES,
  deg2rad,
  generateTideGraphData,
  getCurrentTideState,
  getEarthRotationAngle,
  getMoonOrbitAngle,
  getTideClassification,
} from '../utils/tidePhysics';
import {
  GitCompare,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sliders,
  MapPin,
  Waves,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
} from 'lucide-react';

interface MultiLatitudeComparisonProps {
  params: SimulationParams;
  latitudes: LatitudeTarget[];
  onUpdateLatitudes: (latitudes: LatitudeTarget[]) => void;
  onSeekTime: (timeHours: number) => void;
}

export const MultiLatitudeComparison: React.FC<MultiLatitudeComparisonProps> = ({
  params,
  latitudes,
  onUpdateLatitudes,
  onSeekTime,
}) => {
  const masterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const globeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [graphWindowHours, setGraphWindowHours] = useState<number>(48);
  const [newLatName, setNewLatName] = useState<string>('');
  const [newLatVal, setNewLatVal] = useState<number>(45);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'overlaid' | 'split'>('overlaid');

  // Available palette for custom latitudes
  const colorPalette = ['#06b6d4', '#f59e0b', '#a855f7', '#10b981', '#f43f5e', '#3b82f6'];

  // Toggle latitude enabled/disabled
  const handleToggleLatitude = (id: string) => {
    onUpdateLatitudes(
      latitudes.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
  };

  // Change individual latitude value
  const handleChangeLatitudeVal = (id: string, val: number) => {
    onUpdateLatitudes(
      latitudes.map((l) => (l.id === id ? { ...l, latitude: val } : l))
    );
  };

  // Remove latitude
  const handleRemoveLatitude = (id: string) => {
    if (latitudes.length <= 1) return;
    onUpdateLatitudes(latitudes.filter((l) => l.id !== id));
  };

  // Add new custom latitude
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `custom-${Date.now()}`;
    const color = colorPalette[latitudes.length % colorPalette.length];
    const newTarget: LatitudeTarget = {
      id,
      name: newLatName.trim() || `위도 ${newLatVal > 0 ? '+' : ''}${newLatVal}°`,
      latitude: newLatVal,
      color,
      enabled: true,
      description: `사용자 정의 위도 ${newLatVal}°`,
    };
    onUpdateLatitudes([...latitudes, newTarget]);
    setNewLatName('');
    setShowAddForm(false);
  };

  // Preset set appliers
  const applyPresetSet = (type: 'standard' | 'hemisphere' | 'extremes') => {
    if (type === 'standard') {
      onUpdateLatitudes(DEFAULT_COMPARISON_LATITUDES);
    } else if (type === 'hemisphere') {
      onUpdateLatitudes([
        {
          id: 'north-mid',
          name: '북반구 중위도 (37.5°N)',
          latitude: 37.5,
          color: '#f59e0b',
          enabled: true,
          description: '북위 37.5° 서울·인천의 일조부등',
        },
        {
          id: 'equator',
          name: '적도 (0°)',
          latitude: 0,
          color: '#06b6d4',
          enabled: true,
          description: '대칭적 반일주조',
        },
        {
          id: 'south-mid',
          name: '남반구 중위도 (37.5°S)',
          latitude: -37.5,
          color: '#3b82f6',
          enabled: true,
          description: '남위 37.5° 멜버른/오클랜드: 역위상 일조부등',
        },
      ]);
    } else if (type === 'extremes') {
      onUpdateLatitudes([
        {
          id: 'equator',
          name: '적도 (0°)',
          latitude: 0,
          color: '#06b6d4',
          enabled: true,
          description: '최대 반일주조',
        },
        {
          id: 'mid-50',
          name: '고위도 경계 (55°N)',
          latitude: 55,
          color: '#a855f7',
          enabled: true,
          description: '혼합조에서 일주조로의 전이대',
        },
        {
          id: 'high-70',
          name: '초고위도 (72°N)',
          latitude: 72,
          color: '#f43f5e',
          enabled: true,
          description: '완전 일주조 (하루 1회 만조)',
        },
      ]);
    }
  };

  // Render Overlaid Master Chart
  useEffect(() => {
    const canvas = masterCanvasRef.current;
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

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    const padLeft = 48;
    const padRight = 24;
    const padTop = 24;
    const padBottom = 32;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const maxY = 4.2;
    const minY = -4.2;
    const yScale = (h: number) => padTop + plotH * (1 - (h - minY) / (maxY - minY));
    const startTime = params.timeHours - graphWindowHours * 0.4;
    const xScale = (t: number) => padLeft + ((t - startTime) / graphWindowHours) * plotW;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let h = -4; h <= 4; h += 1) {
      const y = yScale(h);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      ctx.fillStyle = h === 0 ? '#94a3b8' : '#475569';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${h > 0 ? '+' : ''}${h}m`, padLeft - 8, y + 3);
    }

    // Zero line
    const zeroY = yScale(0);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(width - padRight, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vertical time lines
    const timeStep = graphWindowHours > 100 ? 72 : graphWindowHours > 30 ? 6 : 3;
    const startTick = Math.floor(startTime / timeStep) * timeStep;
    for (let t = startTick; t <= startTime + graphWindowHours; t += timeStep) {
      const x = xScale(t);
      if (x < padLeft || x > width - padRight) continue;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const day = Math.floor(t / 24) + 1;
      const hour = Math.floor(t % 24);
      ctx.fillText(graphWindowHours > 100 ? `${day}일` : `${day}일 ${hour}시`, x, height - padBottom + 16);
    }

    // Draw curves for all enabled latitudes
    const activeTargets = latitudes.filter((l) => l.enabled);
    const stepHours = graphWindowHours > 100 ? 0.5 : 0.1;

    activeTargets.forEach((target) => {
      const customParams: SimulationParams = {
        ...params,
        latitude: target.latitude,
      };
      const pts = generateTideGraphData(
        params.timeHours + graphWindowHours * 0.1,
        graphWindowHours,
        stepHours,
        customParams
      );

      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const x = xScale(pts[i].timeHours);
        const y = yScale(pts[i].totalHeight);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = target.color;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Current point dot
      const currentH = calculateTideHeightAtTime(params.timeHours, customParams).totalHeight;
      const curX = xScale(params.timeHours);
      if (curX >= padLeft && curX <= width - padRight) {
        const curY = yScale(currentH);
        ctx.beginPath();
        ctx.arc(curX, curY, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = target.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // Vertical current time tracking line
    const curX = xScale(params.timeHours);
    if (curX >= padLeft && curX <= width - padRight) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(curX, padTop);
      ctx.lineTo(curX, height - padBottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [params, latitudes, graphWindowHours]);

  // Render Multi-Latitude Earth Globe
  useEffect(() => {
    const canvas = globeCanvasRef.current;
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

    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const earthRadius = Math.min(width, height) * 0.32;
    const moonAngle = getMoonOrbitAngle(params.timeHours);
    const earthAngle = getEarthRotationAngle(params.timeHours);

    // Tidal Bulge
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(moonAngle);

    const bulgeAmp = earthRadius * 0.22;
    ctx.beginPath();
    ctx.ellipse(0, 0, earthRadius + bulgeAmp, earthRadius - bulgeAmp * 0.4, 0, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Solid Earth disk
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, 2 * Math.PI);
    const earthGrad = ctx.createRadialGradient(
      centerX - earthRadius * 0.2,
      centerY - earthRadius * 0.2,
      0,
      centerX,
      centerY,
      earthRadius
    );
    earthGrad.addColorStop(0, '#1e3a8a');
    earthGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = earthGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Rotation direction arc
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.beginPath();
    ctx.arc(0, 0, earthRadius * 0.3, 0.2, 1.4);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Render each enabled latitude circle & observer pin
    latitudes.filter((l) => l.enabled).forEach((target) => {
      const phi = deg2rad(target.latitude);
      const latRadius = earthRadius * Math.cos(phi);

      // Latitude circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, latRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = target.color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Observer pin rotating along latitude circle
      const obsX = centerX + Math.cos(earthAngle) * latRadius;
      const obsY = centerY + Math.sin(earthAngle) * latRadius;

      ctx.beginPath();
      ctx.arc(obsX, obsY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = target.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pin label
      ctx.fillStyle = target.color;
      ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${target.name} (${target.latitude > 0 ? '+' : ''}${target.latitude.toFixed(0)}°)`, obsX + 8, obsY - 4);
      ctx.restore();
    });

    ctx.restore();
  }, [params, latitudes]);

  return (
    <div className="space-y-5">
      {/* Top Controls & Preset Selector */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <GitCompare className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-white">다중 위도 조석 비교 모드</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            지구상의 여러 위도를 선택하여 동일한 천체 조건 하에서 발생하는 조석 형태를 나란히 비교합니다.
          </p>
        </div>

        {/* Preset Sets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPresetSet('standard')}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            표준 4대 위도 (적도·중위도·고위도·극지)
          </button>
          <button
            type="button"
            onClick={() => applyPresetSet('hemisphere')}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            남반구 vs 북반구 대칭
          </button>
          <button
            type="button"
            onClick={() => applyPresetSet('extremes')}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            일주조 전이대 (55°~72°)
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>위도 추가</span>
          </button>
        </div>
      </div>

      {/* Custom Latitude Adder Form if active */}
      {showAddForm && (
        <form
          onSubmit={handleAddCustom}
          className="flex flex-wrap items-center gap-3 p-4 bg-slate-950/80 border border-cyan-800/60 rounded-xl text-xs"
        >
          <div className="flex items-center gap-2">
            <label className="text-slate-300 font-medium">지역/위도명:</label>
            <input
              type="text"
              placeholder="예: 런던, 시드니, 위도 50°"
              value={newLatName}
              onChange={(e) => setNewLatName(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white w-40 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-300 font-medium">위도 값:</label>
            <input
              type="number"
              min={-90}
              max={90}
              step={0.5}
              value={newLatVal}
              onChange={(e) => setNewLatVal(parseFloat(e.target.value) || 0)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white w-20 text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-400">° (-90° ~ +90°)</span>
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors"
          >
            비교 목록에 추가
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs"
          >
            취소
          </button>
        </form>
      )}

      {/* Main Split: Synchronized Overlaid Graph (Left ~68%) + Multi-Pin Earth Globe (Right ~32%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Overlaid Master Graph */}
        <div className="lg:col-span-8 flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-100">
                실시간 위도별 조위 곡선 중첩 비교 (Synchronized Overlaid Curves)
              </span>
            </div>

            {/* Time Window Buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setGraphWindowHours(24)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  graphWindowHours === 24 ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                24시간 (1일)
              </button>
              <button
                type="button"
                onClick={() => setGraphWindowHours(48)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  graphWindowHours === 48 ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                48시간 (2일)
              </button>
              <button
                type="button"
                onClick={() => setGraphWindowHours(168)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  graphWindowHours === 168 ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                7일 (1주일)
              </button>
            </div>
          </div>

          <div className="relative w-full h-[320px]">
            <canvas ref={masterCanvasRef} className="w-full h-full block" />

            {/* Overlaid Legends */}
            <div className="absolute top-2.5 right-3 flex flex-wrap items-center gap-2.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/80 backdrop-blur-sm pointer-events-none text-[11px]">
              {latitudes.filter((l) => l.enabled).map((l) => (
                <div key={l.id} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 rounded-full" style={{ backgroundColor: l.color }} />
                  <span style={{ color: l.color }} className="font-medium">
                    {l.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-Pin Globe Visualizer */}
        <div className="lg:col-span-4 flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-3 bg-slate-950/70 border-b border-slate-800">
            <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-purple-400" />
              <span>위도선 및 관측자 위치 동시 시각화</span>
            </div>
            <div className="text-[10px] text-slate-400">
              각 위도별 관측자 핀이 지구와 함께 자전합니다
            </div>
          </div>

          <div className="relative flex-1 min-h-[260px]">
            <canvas ref={globeCanvasRef} className="w-full h-full block" />
          </div>
        </div>
      </div>

      {/* Side-by-Side Latitude Comparative Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            위도별 실시간 조석 특성 나란히 비교 ({latitudes.filter((l) => l.enabled).length}개 위도 활성)
          </h3>
          <span className="text-[11px] text-slate-400">
            각 카드의 슬라이더로 위도를 자유롭게 미세 조정할 수 있습니다
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {latitudes.map((target) => {
            const customParams: SimulationParams = {
              ...params,
              latitude: target.latitude,
            };
            const tideState = getCurrentTideState(params.timeHours, customParams);
            const classification = getTideClassification(
              target.latitude,
              tideState.diurnalInequality,
              tideState.tidalRange
            );

            return (
              <div
                key={target.id}
                className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                  target.enabled
                    ? 'bg-slate-900/80 border-slate-800 shadow-lg'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                {/* Top bar with color badge & enable checkbox */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: target.color }}
                      />
                      <span className="font-semibold text-xs text-white truncate max-w-[140px]">
                        {target.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleLatitude(target.id)}
                        className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                          target.enabled
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                            : 'border-slate-700 bg-slate-800 text-transparent'
                        }`}
                        title={target.enabled ? '비활성화' : '활성화'}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </button>

                      {latitudes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLatitude(target.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tide Regime Classification Badge */}
                  <div className="mb-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md border ${classification.badgeColor}`}
                    >
                      {classification.label}
                    </span>
                  </div>

                  {/* Live Sea Level Gauge */}
                  <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 mb-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">현재 조위:</span>
                      <span className="font-mono font-bold text-sm text-cyan-300 tabular-nums">
                        {tideState.currentHeight >= 0 ? '+' : ''}
                        {tideState.currentHeight.toFixed(2)}m
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">당일 조차:</span>
                      <span className="font-mono font-semibold text-amber-300 tabular-nums">
                        {tideState.tidalRange.toFixed(2)}m
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">일조부등(차이):</span>
                      <span className="font-mono font-semibold text-purple-300 tabular-nums">
                        {tideState.diurnalInequality.toFixed(2)}m
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60 text-slate-400">
                      <span>상태:</span>
                      <span className="font-medium text-slate-200">
                        {tideState.isFlooding ? '▲ 밀물(창조)' : tideState.isEbbing ? '▼ 썰물(낙조)' : '● 정조'}
                      </span>
                    </div>
                  </div>

                  {/* Scientific Explanation for this latitude */}
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {classification.explanation}
                  </p>
                </div>

                {/* Slider for Latitude Fine-Tuning */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>위도 미세조정:</span>
                    <span className="font-mono font-bold text-slate-200 tabular-nums">
                      {target.latitude > 0 ? `+${target.latitude.toFixed(1)}°` : `${target.latitude.toFixed(1)}°`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-90}
                    max={90}
                    step={0.5}
                    value={target.latitude}
                    onChange={(e) =>
                      handleChangeLatitudeVal(target.id, parseFloat(e.target.value))
                    }
                    className="w-full h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
