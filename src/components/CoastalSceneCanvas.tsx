import React, { useEffect, useRef } from 'react';
import { SimulationParams, TideState } from '../types/tide';
import { getEarthRotationAngle, getMoonOrbitAngle } from '../utils/tidePhysics';
import { Anchor, Waves, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';

interface CoastalSceneCanvasProps {
  params: SimulationParams;
  tideState: TideState;
}

export const CoastalSceneCanvas: React.FC<CoastalSceneCanvasProps> = ({
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

    renderHarborScene(ctx, width, height, params, tideState);

    ctx.restore();
  }, [params, tideState]);

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Top Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Anchor className="h-4 w-4" />
          </div>
          <div>
            <div className="font-semibold text-xs text-slate-100 flex items-center gap-2">
              <span>서해안 항구 & 갯벌 단면 체감 뷰 (Coastal Harbor)</span>
            </div>
            <div className="text-[10px] text-slate-400">
              조석 현상에 따라 해수면이 오르내리고 갯벌이 드러나는 실제 해안 풍경
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <Waves className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">실시간 수위:</span>
            <span className="font-mono font-bold text-cyan-300 tabular-nums">
              {tideState.currentHeight >= 0 ? '+' : ''}
              {tideState.currentHeight.toFixed(2)}m
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              tideState.isFlooding
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                : tideState.isEbbing
                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {tideState.isFlooding ? (
              <>
                <ArrowUpRight className="h-3.5 w-3.5 text-cyan-400" />
                <span>창조 (밀물: 물 들어오는 중)</span>
              </>
            ) : tideState.isEbbing ? (
              <>
                <ArrowDownRight className="h-3.5 w-3.5 text-amber-400" />
                <span>낙조 (썰물: 물 빠지는 중)</span>
              </>
            ) : (
              <>
                <Compass className="h-3.5 w-3.5 text-slate-400" />
                <span>정조 (유속 0 / 최고·최저 수위)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 w-full min-h-[380px] sm:min-h-[440px]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Harbor info floating overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 max-w-xs shadow-xl pointer-events-none">
          <div className="font-semibold text-slate-100 mb-1 flex items-center justify-between">
            <span>해안 조간대(갯벌) 변화 관찰</span>
            <span className="text-[10px] text-cyan-400 font-mono">
              조차: {tideState.tidalRange.toFixed(2)}m
            </span>
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            {tideState.currentHeight < -1.0 ? (
              <span className="text-amber-300">
                • 현재 <b>간조(저조)</b> 시간대입니다. 광활한 갯벌이 노출되어 조개, 게 등의 조간대 생물이 활발해집니다.
              </span>
            ) : tideState.currentHeight > 1.0 ? (
              <span className="text-cyan-300">
                • 현재 <b>만조(고조)</b> 시간대입니다. 해수면이 부두 상단까지 차오르고 선박의 출입항이 자유로워집니다.
              </span>
            ) : (
              <span>
                • 밀물과 썰물이 교차하며 해안선의 위치가 수백 미터씩 역동적으로 이동합니다.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function renderHarborScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: SimulationParams,
  tideState: TideState
) {
  // Day / Night cycle based on Earth rotation
  const earthAngle = getEarthRotationAngle(params.timeHours);
  // Noon when earthAngle = 0, Midnight when earthAngle = PI
  const sunElevation = Math.cos(earthAngle);
  const isDay = sunElevation > -0.2;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65);
  if (isDay) {
    skyGrad.addColorStop(0, '#0c4a6e'); // deep coastal daylight blue
    skyGrad.addColorStop(0.6, '#0284c7');
    skyGrad.addColorStop(1, '#bae6fd');
  } else {
    skyGrad.addColorStop(0, '#020617'); // night sky
    skyGrad.addColorStop(0.6, '#090d16');
    skyGrad.addColorStop(1, '#1e293b');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // If Night, draw Moon and stars
  if (!isDay) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 30; i++) {
      ctx.fillRect((i * 47) % width, (i * 23) % (height * 0.45), 1.2, 1.2);
    }
    // Moon in the sky
    const moonSkyX = width * 0.82;
    const moonSkyY = height * 0.18;
    ctx.save();
    ctx.beginPath();
    ctx.arc(moonSkyX, moonSkyY, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(248, 250, 252, 0.4)';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }

  // Mountains in distant background
  ctx.fillStyle = isDay ? '#075985' : '#0f172a';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.55);
  ctx.lineTo(width * 0.25, height * 0.38);
  ctx.lineTo(width * 0.45, height * 0.48);
  ctx.lineTo(width * 0.65, height * 0.36);
  ctx.lineTo(width * 0.85, height * 0.45);
  ctx.lineTo(width, height * 0.4);
  ctx.lineTo(width, height * 0.65);
  ctx.lineTo(0, height * 0.65);
  ctx.closePath();
  ctx.fill();

  // Seafloor & Mudflat contour (갯벌 바닥)
  const seabedY = height * 0.78;
  const mudflatLeftX = width * 0.35;
  const mudflatRightX = width;

  ctx.fillStyle = '#78350f'; // rich mud sediment
  ctx.beginPath();
  ctx.moveTo(mudflatLeftX, seabedY - 30);
  ctx.bezierCurveTo(width * 0.5, seabedY - 20, width * 0.75, seabedY + 20, mudflatRightX, seabedY + 35);
  ctx.lineTo(width, height);
  ctx.lineTo(mudflatLeftX, height);
  ctx.closePath();
  ctx.fill();

  // Sandy / mud texture
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(mudflatLeftX, seabedY - 26);
  ctx.bezierCurveTo(width * 0.5, seabedY - 18, width * 0.75, seabedY + 22, mudflatRightX, seabedY + 38);
  ctx.lineTo(width, seabedY + 45);
  ctx.lineTo(mudflatLeftX, seabedY - 15);
  ctx.closePath();
  ctx.fill();

  // Left rocky cliff & pier base
  const cliffWidth = width * 0.35;
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.45);
  ctx.lineTo(cliffWidth * 0.7, height * 0.45);
  ctx.lineTo(cliffWidth * 0.9, height * 0.58);
  ctx.lineTo(cliffWidth, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Lighthouse on the cliff
  const lhX = cliffWidth * 0.4;
  const lhBaseY = height * 0.45;
  ctx.save();
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(lhX - 12, lhBaseY);
  ctx.lineTo(lhX - 8, lhBaseY - 65);
  ctx.lineTo(lhX + 8, lhBaseY - 65);
  ctx.lineTo(lhX + 12, lhBaseY);
  ctx.closePath();
  ctx.fill();

  // Red stripes on lighthouse
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(lhX - 10, lhBaseY - 25, 20, 10);
  ctx.fillRect(lhX - 9, lhBaseY - 50, 18, 10);

  // Lantern room
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(lhX, lhBaseY - 70, 7, 0, 2 * Math.PI);
  ctx.fill();

  // Light beam if night
  if (!isDay) {
    ctx.save();
    ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
    ctx.beginPath();
    ctx.moveTo(lhX, lhBaseY - 70);
    ctx.lineTo(width, lhBaseY - 110);
    ctx.lineTo(width, lhBaseY - 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // Pier / Wooden Dock structure
  const pierDeckY = height * 0.54;
  const pierStartX = cliffWidth * 0.55;
  const pierEndX = cliffWidth * 1.35;

  ctx.fillStyle = '#451a03'; // wooden timber
  // Wooden pilings
  for (let px = pierStartX + 20; px < pierEndX; px += 35) {
    ctx.fillRect(px - 3, pierDeckY, 6, height - pierDeckY);
  }
  // Pier deck plank
  ctx.fillRect(pierStartX, pierDeckY, pierEndX - pierStartX, 10);

  // Tide Level Gauge Pole / Depth Ruler on the pier
  const poleX = pierEndX - 15;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(poleX - 6, height * 0.46, 12, height * 0.4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(poleX - 5, height * 0.47, 10, height * 0.38);

  // Depth ruler tick marks and numbers (-3m to +3m)
  ctx.fillStyle = '#000000';
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  for (let m = -3; m <= 3; m++) {
    // Map m (-3 to +3) to y
    const ty = height * 0.65 - m * 18;
    ctx.fillRect(poleX - 5, ty, 6, 1.2);
    if (m % 1 === 0) {
      ctx.fillText(`${m > 0 ? '+' : ''}${m}`, poleX + 14, ty + 3);
    }
  }

  // High tide line & Low tide line indicator text on pole
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(poleX - 8, height * 0.65 - 2.8 * 18, 16, 2);
  ctx.fillText('만조선', poleX - 22, height * 0.65 - 2.8 * 18 + 3);

  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(poleX - 8, height * 0.65 - (-2.8) * 18, 16, 2);
  ctx.fillText('간조선', poleX - 22, height * 0.65 - (-2.8) * 18 + 3);

  // -------------------------------------------------------------
  // Dynamic Water Surface Rendering based on current tide height!
  // -------------------------------------------------------------
  // Mean sea level corresponds to height * 0.65
  // Amplitude maps 1m to ~18px
  const waterSurfaceY = height * 0.65 - tideState.currentHeight * 18;

  // Draw Water Volume
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cliffWidth * 0.75, waterSurfaceY);

  // Wave ripple on surface
  const waveTime = Date.now() * 0.003;
  for (let x = cliffWidth * 0.75; x <= width; x += 10) {
    const wave = Math.sin(x * 0.04 + waveTime) * 3 + Math.cos(x * 0.02 - waveTime * 1.5) * 2;
    ctx.lineTo(x, waterSurfaceY + wave);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(cliffWidth * 0.75, height);
  ctx.closePath();

  // Water gradient
  const waterGrad = ctx.createLinearGradient(0, waterSurfaceY, 0, height);
  waterGrad.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
  waterGrad.addColorStop(0.3, 'rgba(14, 116, 144, 0.9)');
  waterGrad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
  ctx.fillStyle = waterGrad;
  ctx.fill();

  // Water surface foam/line
  ctx.strokeStyle = 'rgba(165, 243, 252, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = cliffWidth * 0.75; x <= width; x += 10) {
    const wave = Math.sin(x * 0.04 + waveTime) * 3 + Math.cos(x * 0.02 - waveTime * 1.5) * 2;
    if (x === cliffWidth * 0.75) ctx.moveTo(x, waterSurfaceY + wave);
    else ctx.lineTo(x, waterSurfaceY + wave);
  }
  ctx.stroke();
  ctx.restore();

  // -------------------------------------------------------------
  // Moored Boat floating on water
  // -------------------------------------------------------------
  const boatX = pierEndX + 55;
  const boatPitch = Math.sin(waveTime * 1.2) * 0.06;
  const boatY = waterSurfaceY + Math.sin(boatX * 0.04 + waveTime) * 3 - 4;

  ctx.save();
  ctx.translate(boatX, boatY);
  ctx.rotate(boatPitch);

  // Boat hull
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-32, -4);
  ctx.lineTo(24, -4);
  ctx.lineTo(36, 6);
  ctx.lineTo(-24, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Boat cabin
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(-18, -16, 20, 12);
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(-14, -13, 6, 6);
  ctx.fillRect(-6, -13, 6, 6);

  // Mast & flag
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(4, -4);
  ctx.lineTo(4, -30);
  ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(4, -30);
  ctx.lineTo(14, -26);
  ctx.lineTo(4, -22);
  ctx.closePath();
  ctx.fill();

  // Mooring rope back to pier
  ctx.restore();
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(boatX - 30, boatY);
  ctx.quadraticCurveTo((boatX - 30 + pierEndX) / 2, boatY + 12, pierEndX - 4, pierDeckY + 2);
  ctx.stroke();

  // Exposed Mudflat details if water is low
  if (waterSurfaceY > seabedY - 10) {
    // Little crabs & starfish on exposed mud
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(mudflatLeftX + 45, seabedY - 20, 3, 0, 2 * Math.PI);
    ctx.arc(mudflatLeftX + 90, seabedY - 5, 2.5, 0, 2 * Math.PI);
    ctx.arc(mudflatLeftX + 160, seabedY + 10, 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('노출된 갯벌 (조간대)', mudflatLeftX + 70, seabedY - 26);
  }
}
