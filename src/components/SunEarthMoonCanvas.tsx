import React, { useEffect, useRef } from 'react';
import { SimulationParams, TideState } from '../types/tide';
import {
  deg2rad,
  getEarthRotationAngle,
  getMoonOrbitAngle,
  getMoonPhaseAngle,
  getMoonPhaseInfo,
  rad2deg,
  SOLAR_TIDAL_RATIO,
} from '../utils/tidePhysics';
import { Sun, Moon, Waves, Gauge } from 'lucide-react';

interface SunEarthMoonCanvasProps {
  params: SimulationParams;
  tideState: TideState;
}

export const SunEarthMoonCanvas: React.FC<SunEarthMoonCanvasProps> = ({
  params,
  tideState,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    // Deep space background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    // Starfield specks
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 40; i++) {
      const sx = (Math.sin(i * 123) * 0.5 + 0.5) * width;
      const sy = (Math.cos(i * 321) * 0.5 + 0.5) * height;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    renderSunEarthMoonScene(ctx, width, height, params, tideState);

    ctx.restore();
  }, [params, tideState]);

  const phaseAngle = getMoonPhaseAngle(params.timeHours);
  const phaseInfo = getMoonPhaseInfo(phaseAngle);

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Top Banner with Real-time Astronomical Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <Sun className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">달의 위상 (월령)</div>
            <div className="font-semibold text-amber-300">{phaseInfo.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
            <Moon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">조석 상태 분류</div>
            <div
              className={`font-semibold ${
                phaseInfo.category === 'spring'
                  ? 'text-cyan-300 font-bold'
                  : phaseInfo.category === 'neap'
                  ? 'text-emerald-300'
                  : 'text-slate-300'
              }`}
            >
              {phaseInfo.categoryName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">기조력 상대 세기</div>
            <div className="font-semibold font-mono text-indigo-300 tabular-nums">
              {(tideState.combinedTidalMagnitude * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
            <Waves className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400">예상 당일 조차</div>
            <div className="font-semibold font-mono text-sky-300 tabular-nums">
              {tideState.tidalRange.toFixed(2)}m
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 w-full min-h-[380px] sm:min-h-[440px]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Real-time Force Breakdown HUD in bottom-right */}
        <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 w-64 shadow-2xl pointer-events-none">
          <div className="font-semibold text-slate-100 mb-2 flex items-center justify-between">
            <span>실시간 기조력 기여율</span>
            <span className="text-[10px] font-mono text-slate-400">Ft ∝ M / R³</span>
          </div>

          {/* Lunar component bar */}
          <div className="mb-2">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-cyan-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> 달의 기조력
              </span>
              <span className="font-mono text-cyan-300 font-semibold">68.5%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500" style={{ width: '68.5%' }} />
            </div>
          </div>

          {/* Solar component bar */}
          <div className="mb-2.5">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> 태양의 기조력
              </span>
              <span className="font-mono text-amber-300 font-semibold">31.5%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: '31.5%' }} />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 leading-relaxed">
            {phaseInfo.category === 'spring' ? (
              <span className="text-cyan-300 font-medium">
                ★ 사리(대조): 태양과 달이 일직선상에 정렬되어 두 기조력이 더해집니다!
              </span>
            ) : phaseInfo.category === 'neap' ? (
              <span className="text-amber-300 font-medium">
                ★ 조금(소조): 태양과 달이 직각(90°)을 이루어 두 기조력이 서로 상쇄됩니다!
              </span>
            ) : (
              <span>두 기조력 벡터가 비스듬하게 합성되며 사리와 조금 사이를 순환합니다.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function renderSunEarthMoonScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: SimulationParams,
  tideState: TideState
) {
  // Center Earth at (width * 0.52, height * 0.5)
  const earthX = width * 0.53;
  const earthY = height * 0.5;
  const earthRadius = Math.min(width, height) * 0.15;
  const moonOrbitRadius = Math.min(width, height) * 0.35;

  // Sun is on the left
  const sunX = width * 0.08;
  const sunY = height * 0.5;
  const sunRadius = Math.min(width, height) * 0.12;

  // 1. Draw Sunlight rays from Sun toward Earth
  ctx.save();
  for (let a = -0.4; a <= 0.4; a += 0.08) {
    const endX = earthX + earthRadius * 1.8;
    const endY = earthY + Math.tan(a) * (endX - sunX);
    const grad = ctx.createLinearGradient(sunX, sunY, endX, endY);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
    grad.addColorStop(0.7, 'rgba(251, 191, 36, 0.06)');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Draw Sun
  ctx.save();
  // Sun corona glow
  const sunCorona = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 2.2);
  sunCorona.addColorStop(0, 'rgba(251, 191, 36, 0.5)');
  sunCorona.addColorStop(0.4, 'rgba(245, 158, 11, 0.2)');
  sunCorona.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2.2, 0, 2 * Math.PI);
  ctx.fillStyle = sunCorona;
  ctx.fill();

  // Sun core
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.4, '#fef08a');
  sunGrad.addColorStop(0.8, '#f59e0b');
  sunGrad.addColorStop(1, '#b45309');
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, 2 * Math.PI);
  ctx.fillStyle = sunGrad;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('태양 (Sun)', sunX, sunY + sunRadius + 20);
  ctx.restore();

  // 3. Moon Orbit Path
  ctx.save();
  ctx.beginPath();
  ctx.arc(earthX, earthY, moonOrbitRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Quadrature & Syzygy markers along orbit
  const positions = [
    { angle: 0, label: '삭 (합삭 / New)', sub: '사리 (대조)' },
    { angle: Math.PI / 2, label: '상현 (1st Qtr)', sub: '조금 (소조)' },
    { angle: Math.PI, label: '망 (보름 / Full)', sub: '사리 (대조)' },
    { angle: (3 * Math.PI) / 2, label: '하현 (3rd Qtr)', sub: '조금 (소조)' },
  ];

  positions.forEach((pos) => {
    // Offset relative to sunlight direction (Sun is at -X from Earth, so 0 angle relative to Sun is towards +X or aligned)
    // In our coordinate system: Sun is at negative X.
    // 삭 (New Moon) is between Earth and Sun -> angle = Math.PI (facing -X)
    // 망 (Full Moon) is opposite Sun -> angle = 0 (facing +X)
    // Let's adopt astronomical convention:
    // Sun vector from Earth: (-1, 0)
    // Moon phase angle relative to Sun:
    // At phase 0 (삭): Moon is at Sun direction (-X): angle = Math.PI
    // At phase PI/2 (상현): Moon is at -Y: angle = -Math.PI / 2
    // At phase PI (망): Moon is at +X: angle = 0
    // At phase 3PI/2 (하현): Moon is at +Y: angle = Math.PI / 2
    const markerAngle = pos.angle + Math.PI;
    const mx = earthX + Math.cos(markerAngle) * moonOrbitRadius;
    const my = earthY + Math.sin(markerAngle) * moonOrbitRadius;

    ctx.beginPath();
    ctx.arc(mx, my, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.fill();

    ctx.font = '9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText(pos.label, mx, my - 8);
  });
  ctx.restore();

  // 4. Calculate Current Moon Position
  // Moon synodic phase angle (0 = New Moon, between Sun and Earth)
  const phaseAngle = getMoonPhaseAngle(params.timeHours);
  // Moon position angle: New Moon is at angle Math.PI (toward Sun)
  const moonCanvasAngle = Math.PI + phaseAngle;
  const moonX = earthX + Math.cos(moonCanvasAngle) * moonOrbitRadius;
  const moonY = earthY + Math.sin(moonCanvasAngle) * moonOrbitRadius;

  // 5. Draw Combined Tidal Bulge
  // The tidal bulge deformation is a superposition of Lunar bulge and Solar bulge!
  // Lunar bulge: orientation is moonCanvasAngle, weight = 1.0
  // Solar bulge: orientation is Math.PI (horizontal), weight = 0.46
  ctx.save();
  ctx.translate(earthX, earthY);

  // Compute deformation radius at 72 points around Earth
  const numBulgePts = 72;
  const bulgeRadiusScale = earthRadius * 0.24;

  ctx.beginPath();
  for (let i = 0; i <= numBulgePts; i++) {
    const angle = (i * 2 * Math.PI) / numBulgePts;

    // Angle relative to Moon
    const thetaM = angle - moonCanvasAngle;
    const lunarComp = 1.0 * (1.5 * Math.cos(thetaM) * Math.cos(thetaM) - 0.5);

    // Angle relative to Sun (Sun is at Math.PI)
    const thetaS = angle - Math.PI;
    const solarComp = SOLAR_TIDAL_RATIO * (1.5 * Math.cos(thetaS) * Math.cos(thetaS) - 0.5);

    const netDeform = lunarComp + solarComp;
    const r = earthRadius + netDeform * bulgeRadiusScale;

    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Color gradient based on Spring vs Neap
  const isSpring = tideState.tideCategory === 'spring';
  const waterGrad = ctx.createRadialGradient(0, 0, earthRadius * 0.7, 0, 0, earthRadius * 1.35);
  if (isSpring) {
    waterGrad.addColorStop(0, 'rgba(14, 116, 144, 0.9)');
    waterGrad.addColorStop(0.7, 'rgba(6, 182, 212, 0.85)');
    waterGrad.addColorStop(1, 'rgba(56, 189, 248, 1)');
  } else {
    waterGrad.addColorStop(0, 'rgba(15, 23, 42, 0.8)');
    waterGrad.addColorStop(0.7, 'rgba(14, 116, 144, 0.75)');
    waterGrad.addColorStop(1, 'rgba(45, 212, 191, 0.9)');
  }
  ctx.fillStyle = waterGrad;
  ctx.fill();
  ctx.strokeStyle = isSpring ? '#38bdf8' : '#2dd4bf';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Solid Earth in center
  ctx.beginPath();
  ctx.arc(0, 0, earthRadius, 0, 2 * Math.PI);
  const earthGrad = ctx.createRadialGradient(-earthRadius * 0.2, 0, 0, 0, 0, earthRadius);
  earthGrad.addColorStop(0, '#1e3a8a');
  earthGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = earthGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Day/Night shadow on Earth (Sun is to the left, so right hemisphere is shaded)
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, earthRadius, -Math.PI / 2, Math.PI / 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fill();
  ctx.restore();

  // Earth label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('지구', 0, 4);

  ctx.restore();

  // 6. Draw Moon with Phase Shading (Sunlight from left)
  ctx.save();
  const moonRadius = earthRadius * 0.28;

  // Moon base
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, 0, 2 * Math.PI);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Moon illuminated hemisphere (facing Sun to the left)
  // Left half is illuminated by the Sun
  ctx.save();
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonRadius, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.fillStyle = '#f1f5f9';
  ctx.fill();
  ctx.restore();

  // Moon Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('달', moonX, moonY + moonRadius + 15);
  ctx.restore();

  // 7. Visual tidal force vectors from Earth towards Sun and Moon
  ctx.save();
  // Vector toward Sun (Solar tide)
  const sunVecLen = earthRadius * 0.55;
  drawArrow(ctx, earthX, earthY, earthX - sunVecLen, earthY, '#f59e0b', 2.5);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('태양 기조력 (32%)', earthX - sunVecLen - 6, earthY - 4);

  // Vector toward Moon (Lunar tide)
  const moonVecDx = Math.cos(moonCanvasAngle) * earthRadius * 1.1;
  const moonVecDy = Math.sin(moonCanvasAngle) * earthRadius * 1.1;
  drawArrow(ctx, earthX, earthY, earthX + moonVecDx, earthY + moonVecDy, '#06b6d4', 3);
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('달 기조력 (68%)', earthX + moonVecDx + 8, earthY + moonVecDy);

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
  const headLen = 8;
  const dx = toX - fromX;
  const dy = toY - fromY;
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
