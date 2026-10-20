import React, { useEffect, useRef, useState } from 'react';
import { SimulationParams, VectorDisplayMode, ViewMode } from '../types/tide';
import {
  calculateSurfaceTidalVectors,
  calculateTideHeightAtTime,
  deg2rad,
  getEarthRotationAngle,
  getMoonOrbitAngle,
  rad2deg,
} from '../utils/tidePhysics';
import { Eye, Layers, ArrowRightLeft } from 'lucide-react';

interface EarthMoonCanvasProps {
  params: SimulationParams;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  vectorMode: VectorDisplayMode;
  onChangeVectorMode: (mode: VectorDisplayMode) => void;
}

export const EarthMoonCanvas: React.FC<EarthMoonCanvasProps> = ({
  params,
  viewMode,
  onChangeViewMode,
  vectorMode,
  onChangeVectorMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
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

      // Deep space background with subtle stars
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Grid/background rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let r = 80; r < Math.max(width, height); r += 80) {
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, r, 0, 2 * Math.PI);
        ctx.stroke();
      }

      if (viewMode === 'cross-section') {
        renderCrossSectionView(ctx, width, height, params);
      } else if (viewMode === 'vectors') {
        renderVectorFieldView(ctx, width, height, params, vectorMode);
      } else {
        renderOrbitalView(ctx, width, height, params);
      }

      ctx.restore();
    };

    render();
  }, [params, viewMode, vectorMode]);

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
      {/* View Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950/70 border-b border-slate-800/80 z-10">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => onChangeViewMode('orbital')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'orbital'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>궤도 평면 뷰 (Top View)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('cross-section')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'cross-section'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>자전축 단면 & 일조부등 뷰</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeViewMode('vectors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'vectors'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>기조력 벡터장 뷰</span>
          </button>
        </div>

        {/* Sub-modes if Vector mode is active */}
        {viewMode === 'vectors' && (
          <div className="flex items-center gap-1 p-0.5 bg-slate-900/90 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onChangeVectorMode('net-tidal')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                vectorMode === 'net-tidal'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              합성 기조력 (Ft)
            </button>
            <button
              type="button"
              onClick={() => onChangeVectorMode('components')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                vectorMode === 'components'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              만유인력+원심력 분해
            </button>
            <button
              type="button"
              onClick={() => onChangeVectorMode('tractive')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                vectorMode === 'tractive'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              수평 견인력
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <div className="relative flex-1 w-full min-h-[380px] sm:min-h-[440px]">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Floating live annotation badge */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-300 max-w-sm pointer-events-none shadow-xl">
          {viewMode === 'orbital' && (
            <div>
              <span className="font-semibold text-cyan-400">궤도 평면 뷰:</span>{' '}
              지구 자전(반시계)과 달의 공전(반시계)에 따라 럭비공 모양의 조석 팽창 타원이 달을 향한 쪽과 반대쪽에 동시에 형성됩니다.
            </div>
          )}
          {viewMode === 'cross-section' && (
            <div>
              <span className="font-semibold text-cyan-400">일조부등 단면 뷰:</span>{' '}
              달의 적위({params.moonDeclination.toFixed(1)}°)로 인해 팽창축이 기울어져, 위도 {params.latitude.toFixed(1)}° 관측자는 12시간 뒤 통과하는 두 만조의 수위가 다릅니다.
            </div>
          )}
          {viewMode === 'vectors' && (
            <div>
              <span className="font-semibold text-cyan-400">기조력 벡터장:</span>{' '}
              달 쪽과 반대쪽 표면에서는 기조력이 바깥쪽으로 작용하여 해수가 팽창하고, 직각 지점에서는 안쪽으로 작용하여 수위가 낮아집니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Render Helper 1: Orbital View (Top-Down with 3D Bulge & Observer)
// -------------------------------------------------------------
function renderOrbitalView(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: SimulationParams
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const earthRadius = Math.min(width, height) * 0.16;
  const moonOrbitRadius = Math.min(width, height) * 0.4 * params.moonDistanceRatio;

  const moonAngle = getMoonOrbitAngle(params.timeHours);
  const earthRotationAngle = getEarthRotationAngle(params.timeHours);
  const phi = deg2rad(params.latitude);

  // 1. Draw Moon Orbit Path
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, moonOrbitRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 2. Gravitational connection line between Earth and Moon
  const moonX = centerX + Math.cos(moonAngle) * moonOrbitRadius;
  const moonY = centerY + Math.sin(moonAngle) * moonOrbitRadius;

  ctx.save();
  const gradLine = ctx.createLinearGradient(centerX, centerY, moonX, moonY);
  gradLine.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
  gradLine.addColorStop(1, 'rgba(248, 250, 252, 0.1)');
  ctx.strokeStyle = gradLine;
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(moonX, moonY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 3. Draw Tidal Bulge Ellipsoid (Ocean Water Deformation)
  // Major axis is aligned with Moon angle
  const bulgeAmplitude = earthRadius * 0.22;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(moonAngle);

  // Bulge glow / outer halo
  ctx.beginPath();
  ctx.ellipse(0, 0, earthRadius + bulgeAmplitude + 4, earthRadius - bulgeAmplitude * 0.4 + 2, 0, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
  ctx.fill();

  // Water ocean layer
  ctx.beginPath();
  ctx.ellipse(0, 0, earthRadius + bulgeAmplitude, earthRadius - bulgeAmplitude * 0.4, 0, 0, 2 * Math.PI);
  const waterGrad = ctx.createRadialGradient(0, 0, earthRadius * 0.7, 0, 0, earthRadius + bulgeAmplitude);
  waterGrad.addColorStop(0, 'rgba(14, 116, 144, 0.85)');
  waterGrad.addColorStop(0.8, 'rgba(6, 182, 212, 0.75)');
  waterGrad.addColorStop(1, 'rgba(34, 211, 238, 0.95)');
  ctx.fillStyle = waterGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Sublunar & Antipodal high tide labels
  ctx.fillStyle = '#67e8f9';
  ctx.font = '10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('만조 (달 쪽 팽창)', earthRadius + bulgeAmplitude + 16, 3);
  ctx.fillText('만조 (반대편 팽창)', -(earthRadius + bulgeAmplitude + 16), 3);

  ctx.restore();

  // 4. Draw Solid Earth (Continental Globe)
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(earthRotationAngle);

  // Earth base disk
  const earthGrad = ctx.createRadialGradient(-earthRadius * 0.3, -earthRadius * 0.3, earthRadius * 0.1, 0, 0, earthRadius);
  earthGrad.addColorStop(0, '#1e3a8a');
  earthGrad.addColorStop(0.7, '#0f172a');
  earthGrad.addColorStop(1, '#020617');
  ctx.beginPath();
  ctx.arc(0, 0, earthRadius, 0, 2 * Math.PI);
  ctx.fillStyle = earthGrad;
  ctx.fill();

  // Continents stylized shapes
  ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
  ctx.beginPath();
  ctx.arc(-earthRadius * 0.25, -earthRadius * 0.2, earthRadius * 0.32, 0, Math.PI * 1.3);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(earthRadius * 0.3, earthRadius * 0.25, earthRadius * 0.3, 0, Math.PI * 1.5);
  ctx.fill();

  // Latitude ring for chosen observer
  const latRadius = earthRadius * Math.cos(phi);
  ctx.beginPath();
  ctx.arc(0, 0, latRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Rotation direction arrow arc
  ctx.beginPath();
  ctx.arc(0, 0, earthRadius * 0.5, 0.2, 1.4);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Arrow head
  const headX = Math.cos(1.4) * earthRadius * 0.5;
  const headY = Math.sin(1.4) * earthRadius * 0.5;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.moveTo(headX, headY);
  ctx.lineTo(headX - 6, headY + 3);
  ctx.lineTo(headX - 3, headY - 6);
  ctx.closePath();
  ctx.fill();

  // Observer Pin positioned on the rotating Earth along their latitude circle
  // Observer is located on Earth at longitude rotating with Earth
  const obsRadius = latRadius;
  const obsX = obsRadius;
  const obsY = 0;

  ctx.restore();

  // Compute World position of observer
  const obsWorldAngle = earthRotationAngle;
  const obsWorldX = centerX + Math.cos(obsWorldAngle) * latRadius;
  const obsWorldY = centerY + Math.sin(obsWorldAngle) * latRadius;

  // Draw Observer Marker Beacon
  ctx.save();
  ctx.beginPath();
  ctx.arc(obsWorldX, obsWorldY, 5.5, 0, 2 * Math.PI);
  ctx.fillStyle = '#f59e0b';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Pulsing ring
  ctx.beginPath();
  ctx.arc(obsWorldX, obsWorldY, 9, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Observer Label
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`관측자 (위도 ${params.latitude.toFixed(0)}°)`, obsWorldX + 12, obsWorldY - 6);

  // Sea level readout at observer
  const currentTide = calculateTideHeightAtTime(params.timeHours, params);
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = currentTide.totalHeight >= 0 ? '#38bdf8' : '#94a3b8';
  ctx.fillText(
    `조위: ${currentTide.totalHeight >= 0 ? '+' : ''}${currentTide.totalHeight.toFixed(2)}m`,
    obsWorldX + 12,
    obsWorldY + 8
  );
  ctx.restore();

  // 5. Draw the Moon
  ctx.save();
  const moonRadius = earthRadius * 0.28;
  const moonGrad = ctx.createRadialGradient(
    moonX - moonRadius * 0.3,
    moonY - moonRadius * 0.3,
    moonRadius * 0.1,
    moonX,
    moonY,
    moonRadius
  );
  moonGrad.addColorStop(0, '#f1f5f9');
  moonGrad.addColorStop(0.5, '#cbd5e1');
  moonGrad.addColorStop(1, '#64748b');

  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, 2 * Math.PI);
  ctx.fillStyle = moonGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Moon craters detail
  ctx.fillStyle = 'rgba(71, 85, 105, 0.4)';
  ctx.beginPath();
  ctx.arc(moonX - moonRadius * 0.2, moonY - moonRadius * 0.1, moonRadius * 0.2, 0, 2 * Math.PI);
  ctx.arc(moonX + moonRadius * 0.3, moonY + moonRadius * 0.2, moonRadius * 0.15, 0, 2 * Math.PI);
  ctx.arc(moonX - moonRadius * 0.1, moonY + moonRadius * 0.3, moonRadius * 0.12, 0, 2 * Math.PI);
  ctx.fill();

  // Moon label
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('달 (Moon)', moonX, moonY + moonRadius + 15);
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`공전: ${((rad2deg(moonAngle) + 360) % 360).toFixed(0)}°`, moonX, moonY + moonRadius + 28);
  ctx.restore();

  // Earth Label in center
  ctx.save();
  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('지구 (Earth)', centerX, centerY + 4);
  ctx.font = '9px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('북극 상공에서 내려다본 뷰', centerX, centerY + 18);
  ctx.restore();
}

// -------------------------------------------------------------
// Render Helper 2: Cross-Section View (Explaining Diurnal Inequality)
// -------------------------------------------------------------
function renderCrossSectionView(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: SimulationParams
) {
  const centerX = width * 0.45;
  const centerY = height / 2;
  const earthRadius = Math.min(width, height) * 0.24;

  const declinationRad = deg2rad(params.moonDeclination);
  const phi = deg2rad(params.latitude);

  // 1. Draw Earth Equator and Axis of Rotation
  // We align Earth rotation axis vertically (tilted 0 or standard frame)
  ctx.save();
  ctx.translate(centerX, centerY);

  // Rotational axis (North-South)
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, -(earthRadius * 1.35));
  ctx.lineTo(0, earthRadius * 1.35);
  ctx.stroke();
  ctx.setLineDash([]);

  // North / South poles
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('북극 (North Pole)', 0, -(earthRadius * 1.4));
  ctx.fillText('남극 (South Pole)', 0, earthRadius * 1.48);

  // Equator line
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-(earthRadius * 1.25), 0);
  ctx.lineTo(earthRadius * 1.25, 0);
  ctx.stroke();
  ctx.fillStyle = '#94a3b8';
  ctx.font = '10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('적도 (Equator)', -(earthRadius * 1.28), 3);

  // 2. Tidal Bulge Ellipsoid tilted by Moon's Declination (delta)
  // When moon declination is delta, the major axis of the bulge is tilted by -delta
  ctx.save();
  ctx.rotate(-declinationRad);

  const bulgeMajor = earthRadius * 1.32;
  const bulgeMinor = earthRadius * 0.88;

  ctx.beginPath();
  ctx.ellipse(0, 0, bulgeMajor, bulgeMinor, 0, 0, 2 * Math.PI);
  const waterGrad = ctx.createRadialGradient(0, 0, earthRadius * 0.5, 0, 0, bulgeMajor);
  waterGrad.addColorStop(0, 'rgba(14, 116, 144, 0.7)');
  waterGrad.addColorStop(0.85, 'rgba(6, 182, 212, 0.55)');
  waterGrad.addColorStop(1, 'rgba(34, 211, 238, 0.85)');
  ctx.fillStyle = waterGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tidal Bulge Axis line
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-bulgeMajor * 1.15, 0);
  ctx.lineTo(bulgeMajor * 1.15, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();

  // 3. Solid Earth Globe
  ctx.beginPath();
  ctx.arc(0, 0, earthRadius, 0, 2 * Math.PI);
  const earthGrad = ctx.createRadialGradient(-earthRadius * 0.2, -earthRadius * 0.2, 0, 0, 0, earthRadius);
  earthGrad.addColorStop(0, '#1e3a8a');
  earthGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = earthGrad;
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 4. Observer's Latitude Circle (cuts horizontally through the sphere)
  const obsY = -Math.sin(phi) * earthRadius;
  const latWidth = Math.cos(phi) * earthRadius;

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-latWidth, obsY);
  ctx.lineTo(latWidth, obsY);
  ctx.stroke();

  // Point A (Sublunar side / High Tide 1)
  const ptAX = latWidth;
  const ptAY = obsY;
  // Point B (Antipodal side / High Tide 2 - 12 hours later)
  const ptBX = -latWidth;
  const ptBY = obsY;

  // Draw Point A
  ctx.beginPath();
  ctx.arc(ptAX, ptAY, 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#ef4444';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw Point B
  ctx.beginPath();
  ctx.arc(ptBX, ptBY, 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#3b82f6';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Point Labels
  ctx.fillStyle = '#fca5a5';
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('A (만조 1 / 고고조)', ptAX + 10, ptAY - 4);

  ctx.fillStyle = '#93c5fd';
  ctx.textAlign = 'right';
  ctx.fillText('B (만조 2 / 저고조)', ptBX - 10, ptBY - 4);

  // Height measurement brackets at Point A and B
  // At Point A, distance to bulge perimeter along angle:
  const cosZA = Math.cos(phi - declinationRad);
  const hA = 1.5 * cosZA * cosZA - 0.5;
  const cosZB = Math.cos(phi + declinationRad);
  const hB = 1.5 * cosZB * cosZB - 0.5;

  ctx.restore();

  // 5. Right explanatory Card (Scientific Insight)
  const panelX = width * 0.72;
  const panelY = height * 0.15;
  const panelW = width * 0.25;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, height * 0.7, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('일조부등 (Diurnal Inequality)', panelX + 14, panelY + 26);

  ctx.font = '11px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  const lines = [
    `관측자 위도 (φ): ${params.latitude.toFixed(1)}°`,
    `달의 적위 (δ): ${params.moonDeclination.toFixed(1)}°`,
    '',
    '• A점 (달 쪽 통과):',
    `  수위 지수: ${Math.max(0, hA * 100).toFixed(0)}%`,
    '• B점 (12h 후 반대편):',
    `  수위 지수: ${Math.max(0, hB * 100).toFixed(0)}%`,
    '',
    `차이(일조부등): ${(Math.abs(hA - hB) * 100).toFixed(0)}%`,
    '',
    params.moonDeclination === 0 || params.latitude === 0
      ? '★ 달이 적도면에 있거나 관측자가 적도일 때: 두 만조의 높이가 같은 정규 반일주조!'
      : Math.abs(hA - hB) > 0.8
      ? '★ 큰 적위 & 고위도: 하루 만조가 1번만 나타나는 일주조 성향!'
      : '★ 중위도 혼합조: 12시간 간격으로 만조 높이가 다른 전형적인 일조부등!',
  ];

  let lineY = panelY + 50;
  lines.forEach((l) => {
    if (l.startsWith('★')) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    } else if (l.startsWith('• A')) {
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    } else if (l.startsWith('• B')) {
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    }
    ctx.fillText(l, panelX + 14, lineY);
    lineY += 18;
  });

  ctx.restore();
}

// -------------------------------------------------------------
// Render Helper 3: Vector Field View (Tidal Force Decomposition)
// -------------------------------------------------------------
function renderVectorFieldView(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: SimulationParams,
  vectorMode: VectorDisplayMode
) {
  const centerX = width / 2;
  const centerY = height / 2;
  const earthRadius = Math.min(width, height) * 0.22;
  const moonAngle = getMoonOrbitAngle(params.timeHours);

  // 1. Draw Earth
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, earthRadius, 0, 2 * Math.PI);
  const earthGrad = ctx.createRadialGradient(
    centerX - earthRadius * 0.3,
    centerY - earthRadius * 0.3,
    earthRadius * 0.1,
    centerX,
    centerY,
    earthRadius
  );
  earthGrad.addColorStop(0, '#1e3a8a');
  earthGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = earthGrad;
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Draw Moon direction pointer
  const moonDist = earthRadius * 1.8;
  const moonDirX = centerX + Math.cos(moonAngle) * moonDist;
  const moonDirY = centerY + Math.sin(moonAngle) * moonDist;

  ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(moonDirX, moonDirY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Moon Direction indicator
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(moonDirX, moonDirY, 12, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('달', moonDirX, moonDirY + 3);

  // 2. Calculate and draw Vectors around Earth
  const vectors = calculateSurfaceTidalVectors(moonAngle, 24);
  const vectorScale = earthRadius * 0.35;

  vectors.forEach((v) => {
    const sx = centerX + v.x * earthRadius;
    const sy = centerY + v.y * earthRadius;

    if (vectorMode === 'net-tidal') {
      // Net tidal force vector Ft
      drawArrow(ctx, sx, sy, sx + v.ftX * vectorScale, sy + v.ftY * vectorScale, '#22d3ee', 1.8);
    } else if (vectorMode === 'components') {
      // Fg (Moon gravity) in yellow
      drawArrow(ctx, sx, sy, sx + v.fgX * vectorScale * 0.7, sy + v.fgY * vectorScale * 0.7, '#fbbf24', 1.2);
      // Fc (Centrifugal counter-force) in purple
      drawArrow(ctx, sx, sy, sx + v.fcX * vectorScale * 0.7, sy + v.fcY * vectorScale * 0.7, '#c084fc', 1.2);
      // Resulting Ft in cyan
      drawArrow(ctx, sx, sy, sx + v.ftX * vectorScale, sy + v.ftY * vectorScale, '#22d3ee', 2);
    } else if (vectorMode === 'tractive') {
      // Tangential Tractive force pulling ocean towards bulges
      drawArrow(ctx, sx, sy, sx + v.tractiveX * vectorScale * 1.3, sy + v.tractiveY * vectorScale * 1.3, '#34d399', 2);
    }
  });

  // 3. Legend in top-left
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(14, 14, 220, vectorMode === 'components' ? 100 : 70, 8);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';

  if (vectorMode === 'net-tidal') {
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('→ 청록색: 기조력 합력 (Ft = Fg - Fc)', 24, 34);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('달 쪽과 반대쪽 모두 바깥으로 뻗어', 24, 52);
    ctx.fillText('양쪽으로 해수면이 팽창합니다.', 24, 68);
  } else if (vectorMode === 'components') {
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('→ 노란색: 달의 만유인력 (Fg)', 24, 34);
    ctx.fillStyle = '#c084fc';
    ctx.fillText('→ 보라색: 중심 공전 원심력 (Fc)', 24, 54);
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('→ 청록색: 차등 기조력 (Ft = Fg + Fc)', 24, 74);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('*먼 쪽은 원심력이 인력보다 커서 바깥으로 작용', 24, 94);
  } else {
    ctx.fillStyle = '#34d399';
    ctx.fillText('→ 녹색: 수평 견인력 (Tractive force)', 24, 34);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('지표면을 따라 물을 끌어당겨', 24, 52);
    ctx.fillText('만조 지점으로 해수를 모으는 실제 힘', 24, 68);
  }

  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  lineWidth: number
) {
  const headLen = 6;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy);

  if (dist < 2) return; // avoid zero-length jitter

  const angle = Math.atan2(dy, dx);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
