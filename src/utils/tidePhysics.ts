/**
 * Physics engine for Tidal Forces and Equilibrium Tide calculations
 */

import { LatitudeTarget, ScenarioPreset, SimulationParams, TideDataPoint, TideState } from '../types/tide';

// Astronomical constants
export const EARTH_ROTATION_PERIOD_HOURS = 24.0;
export const MOON_ORBIT_PERIOD_DAYS = 27.32166; // Sidereal orbit
export const MOON_SYNODIC_PERIOD_DAYS = 29.53059; // Synodic month (phases)
export const LUNAR_TIDAL_RATIO = 1.0; // Normalized base
export const SOLAR_TIDAL_RATIO = 0.46; // Solar tide is ~46% of lunar tide
export const BASE_TIDAL_AMPLITUDE = 2.4; // Base open/coastal amplified amplitude in meters

// Degrees to radians
export const deg2rad = (deg: number) => (deg * Math.PI) / 180;
export const rad2deg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Calculates the Moon's orbital angle (radians) at given time (hours).
 * Starts at 0 rad (right side / align with X axis).
 */
export function getMoonOrbitAngle(timeHours: number): number {
  const periodHours = MOON_ORBIT_PERIOD_DAYS * 24.0;
  return (2 * Math.PI * (timeHours % periodHours)) / periodHours;
}

/**
 * Calculates the Earth's rotation angle (radians) at given time (hours).
 */
export function getEarthRotationAngle(timeHours: number): number {
  return (2 * Math.PI * (timeHours % EARTH_ROTATION_PERIOD_HOURS)) / EARTH_ROTATION_PERIOD_HOURS;
}

/**
 * Calculates Moon Phase angle relative to the Sun (0 = New Moon, PI/2 = 1st Quarter, PI = Full, 3PI/2 = 3rd Quarter).
 */
export function getMoonPhaseAngle(timeHours: number): number {
  const synodicPeriodHours = MOON_SYNODIC_PERIOD_DAYS * 24.0;
  return (2 * Math.PI * (timeHours % synodicPeriodHours)) / synodicPeriodHours;
}

/**
 * Get name and illumination of the moon phase
 */
export function getMoonPhaseInfo(phaseAngle: number): {
  name: string;
  illumination: number;
  category: 'spring' | 'neap' | 'intermediate';
  categoryName: string;
} {
  // Normalize angle between 0 and 2PI
  const angle = ((phaseAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const illumination = 0.5 * (1 - Math.cos(angle));

  // Check proximity to Syzygy (0 or PI) vs Quadrature (PI/2 or 3PI/2)
  const distToSyzygy = Math.min(
    Math.abs(angle - 0),
    Math.abs(angle - Math.PI),
    Math.abs(angle - 2 * Math.PI)
  );
  const distToQuadrature = Math.min(
    Math.abs(angle - Math.PI / 2),
    Math.abs(angle - (3 * Math.PI) / 2)
  );

  let category: 'spring' | 'neap' | 'intermediate' = 'intermediate';
  let categoryName = '중조 (평상시)';

  if (distToSyzygy < Math.PI / 8) {
    category = 'spring';
    categoryName = '사리 (대조 / 조차 최대)';
  } else if (distToQuadrature < Math.PI / 8) {
    category = 'neap';
    categoryName = '조금 (소조 / 조차 최소)';
  }

  let name = '';
  const deg = rad2deg(angle);
  if (deg >= 345 || deg < 15) name = '삭 (그믐달 / 합삭)';
  else if (deg >= 15 && deg < 75) name = '초승달';
  else if (deg >= 75 && deg < 105) name = '상현달 (반달)';
  else if (deg >= 105 && deg < 165) name = '차오르는 달';
  else if (deg >= 165 && deg < 195) name = '망 (보름달)';
  else if (deg >= 195 && deg < 255) name = '기우는 달';
  else if (deg >= 255 && deg < 285) name = '하현달 (반달)';
  else name = '그믐달';

  return { name, illumination, category, categoryName };
}

/**
 * Calculates equilibrium tide height anomaly at specific observer latitude and time.
 * Implements Laplace spherical harmonic tidal potential decomposition:
 * h = A * (3/2 * cos^2(z) - 1/2)
 */
export function calculateTideHeightAtTime(
  timeHours: number,
  params: SimulationParams
): {
  lunarHeight: number;
  solarHeight: number;
  totalHeight: number;
} {
  const { latitude, moonDeclination, moonDistanceRatio, sunActive } = params;

  const phi = deg2rad(latitude);
  const deltaM = deg2rad(moonDeclination);

  // Observer's longitude rotates with Earth: lambda_o = omega_e * t
  // Moon longitude in inertial frame: lambda_m = omega_m * t
  // Hour angle of Moon: H_m = lambda_o - lambda_m
  const omegaE = (2 * Math.PI) / EARTH_ROTATION_PERIOD_HOURS;
  const omegaM = (2 * Math.PI) / (MOON_ORBIT_PERIOD_DAYS * 24.0);
  const Hm = (omegaE - omegaM) * timeHours;

  // Zenith angle of Moon: cos(zm) = sin(phi)*sin(deltaM) + cos(phi)*cos(deltaM)*cos(Hm)
  const cosZm = Math.sin(phi) * Math.sin(deltaM) + Math.cos(phi) * Math.cos(deltaM) * Math.cos(Hm);
  // P2(cosZm) = 3/2 * cos^2(zm) - 1/2
  const p2m = 1.5 * cosZm * cosZm - 0.5;

  // Amplitude scaled by inverse cube of lunar distance ratio: A ~ (d0 / d)^3
  const distFactor = Math.pow(1 / Math.max(0.5, moonDistanceRatio), 3);
  const lunarHeight = BASE_TIDAL_AMPLITUDE * distFactor * p2m;

  let solarHeight = 0;
  if (sunActive) {
    // Sun declination (assumed near 0 or small for clarity in spring/neap analysis)
    const deltaS = 0;
    // Sun hour angle: Hs = omegaE * t
    const Hs = omegaE * timeHours;
    const cosZs = Math.sin(phi) * Math.sin(deltaS) + Math.cos(phi) * Math.cos(deltaS) * Math.cos(Hs);
    const p2s = 1.5 * cosZs * cosZs - 0.5;
    solarHeight = BASE_TIDAL_AMPLITUDE * SOLAR_TIDAL_RATIO * p2s;
  }

  const totalHeight = lunarHeight + solarHeight;
  return { lunarHeight, solarHeight, totalHeight };
}

/**
 * Generates an array of tide data points over a given time window (e.g. 24h, 48h, or 720h).
 */
export function generateTideGraphData(
  centerTimeHours: number,
  windowHours: number,
  stepHours: number,
  params: SimulationParams
): TideDataPoint[] {
  const startTime = centerTimeHours - windowHours / 2;
  const numSteps = Math.ceil(windowHours / stepHours);
  const points: TideDataPoint[] = [];

  for (let i = 0; i <= numSteps; i++) {
    const t = startTime + i * stepHours;
    const { lunarHeight, solarHeight, totalHeight } = calculateTideHeightAtTime(t, params);
    points.push({
      timeHours: t,
      lunarHeight,
      solarHeight,
      totalHeight,
    });
  }

  // Detect local extrema (High/Low tides)
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1].totalHeight;
    const curr = points[i].totalHeight;
    const next = points[i + 1].totalHeight;

    if (curr > prev && curr > next) {
      points[i].isHighTide = true;
    } else if (curr < prev && curr < next) {
      points[i].isLowTide = true;
    }
  }

  return points;
}

/**
 * Calculates current real-time tide state (extrema, tidal range, flood/ebb status, inequality)
 */
export function getCurrentTideState(timeHours: number, params: SimulationParams): TideState {
  const current = calculateTideHeightAtTime(timeHours, params);
  const dt = 0.05; // 3 minutes
  const next = calculateTideHeightAtTime(timeHours + dt, params);
  const rate = (next.totalHeight - current.totalHeight) / dt; // m/hour

  // Sample across 25 hours (1 lunar day) to find min and max today
  let minToday = Infinity;
  let maxToday = -Infinity;
  const highTides: number[] = [];

  const samplePoints = 120;
  for (let i = -60; i <= 60; i++) {
    const t = timeHours + (i * 25.0) / 120;
    const h = calculateTideHeightAtTime(t, params).totalHeight;
    if (h < minToday) minToday = h;
    if (h > maxToday) maxToday = h;
  }

  // Find consecutive high tide heights for diurnal inequality
  // Sample along a lunar cycle
  for (let i = 0; i < 60; i++) {
    const t = timeHours - 12.5 + i * 0.5;
    const prevH = calculateTideHeightAtTime(t - 0.25, params).totalHeight;
    const currH = calculateTideHeightAtTime(t, params).totalHeight;
    const nextH = calculateTideHeightAtTime(t + 0.25, params).totalHeight;
    if (currH > prevH && currH > nextH) {
      highTides.push(currH);
    }
  }

  let diurnalInequality = 0;
  if (highTides.length >= 2) {
    diurnalInequality = Math.abs(highTides[0] - highTides[1]);
  }

  const phaseAngle = getMoonPhaseAngle(timeHours);
  const phaseInfo = getMoonPhaseInfo(phaseAngle);

  const lunarTidalMagnitude = params.sunActive ? 1.0 : 1.0;
  const solarTidalMagnitude = params.sunActive ? SOLAR_TIDAL_RATIO : 0;
  // Alignment factor: cos of angle between Moon and Sun
  const alignmentFactor = params.sunActive ? Math.abs(Math.cos(phaseAngle)) : 0;
  const combinedTidalMagnitude = params.sunActive
    ? 1.0 + SOLAR_TIDAL_RATIO * (2 * alignmentFactor * alignmentFactor - 1)
    : 1.0;

  return {
    currentHeight: current.totalHeight,
    maxHeightToday: maxToday,
    minHeightToday: minToday,
    tidalRange: Math.max(0, maxToday - minToday),
    isFlooding: rate > 0.05,
    isEbbing: rate < -0.05,
    floodEbbRate: rate,
    moonPhaseAngle: phaseAngle,
    moonPhaseName: phaseInfo.name,
    moonIllumination: phaseInfo.illumination,
    lunarTidalMagnitude,
    solarTidalMagnitude,
    combinedTidalMagnitude,
    tideCategory: phaseInfo.category,
    tideCategoryName: phaseInfo.categoryName,
    diurnalInequality,
  };
}

/**
 * Vector representation for surface points of Earth to display Tidal Force vectors
 */
export interface TidalVector {
  x: number; // surface position on unit circle
  y: number;
  theta: number; // angle from Moon direction
  fgX: number; // Moon gravity component
  fgY: number;
  fcX: number; // Centrifugal counter-force component
  fcY: number;
  ftX: number; // Net tidal force vector
  ftY: number;
  tractiveX: number; // Tangential tractive force
  tractiveY: number;
}

/**
 * Calculates tidal force vectors at N points around Earth's circumference.
 * moonAngle is the orientation of the Moon relative to Earth (in radians).
 */
export function calculateSurfaceTidalVectors(
  moonAngle: number,
  numPoints: number = 24
): TidalVector[] {
  const vectors: TidalVector[] = [];
  const D = 60; // Moon distance in Earth radii

  for (let i = 0; i < numPoints; i++) {
    const worldAngle = (i * 2 * Math.PI) / numPoints;
    // Relative angle from Moon direction: theta
    const theta = worldAngle - moonAngle;

    // Unit position on Earth surface in world frame
    const x = Math.cos(worldAngle);
    const y = Math.sin(worldAngle);

    // Theoretical exact differential tidal force in frame aligned with Moon:
    // Radial component: Fr = 3*cos^2(theta) - 1
    // Tangential component: Ftheta = -3/2 * sin(2*theta)
    const fr = 3 * Math.cos(theta) * Math.cos(theta) - 1.0;
    const ftan = -1.5 * Math.sin(2 * theta);

    // Convert (fr, ftan) to world (X, Y)
    // Unit radial vector: (cos(worldAngle), sin(worldAngle))
    // Unit tangential vector: (-sin(worldAngle), cos(worldAngle))
    const ftX = fr * Math.cos(worldAngle) - ftan * Math.sin(worldAngle);
    const ftY = fr * Math.sin(worldAngle) + ftan * Math.cos(worldAngle);

    // Tangential tractive force only
    const tractiveX = -ftan * Math.sin(worldAngle);
    const tractiveY = ftan * Math.cos(worldAngle);

    // Components: Moon gravity vector (pointing toward Moon (cos(moonAngle)*D, sin(moonAngle)*D))
    // Centrifugal counter-force: uniform vector pointing away from Moon
    const fcX = -2.0 * Math.cos(moonAngle);
    const fcY = -2.0 * Math.sin(moonAngle);

    const fgX = ftX - fcX;
    const fgY = ftY - fcY;

    vectors.push({
      x,
      y,
      theta,
      fgX,
      fgY,
      fcX,
      fcY,
      ftX,
      ftY,
      tractiveX,
      tractiveY,
    });
  }

  return vectors;
}

/**
 * Presets for guided educational exploration
 */
export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'multi-lat-compare',
    title: '다중 위도 조석 나란히 비교',
    subtitle: '적도(반일주조) vs 중위도(혼합조) vs 고위도(일주조)',
    tab: 'multi-latitude',
    latitude: 37.5,
    moonDeclination: 23.5,
    description:
      '적도(0°), 한국 중위도(37.5°), 고위도(65°), 극지(90°) 4개 지점을 동일한 시간 축에서 나란히 비교합니다. 위도에 따라 조석 형태가 어떻게 반일주조에서 혼합조, 일주조, 극지 미약 조석으로 드라마틱하게 변화하는지 한눈에 확인할 수 있습니다.',
    expectedBehavior: '중첩 조위 곡선과 카드에서 위도별 파형 차이, 진폭 차이, 일조부등의 강도가 확연히 드러납니다.',
  },
  {
    id: 'korea-midlat',
    title: '대한민국 중위도 (인천·서해안)',
    subtitle: '위도 37.5° / 뚜렷한 일조부등과 조차',
    tab: 'earth-moon',
    latitude: 37.5,
    moonDeclination: 23.5,
    description:
      '달이 적도에서 북쪽으로 기울어져(적위 23.5°) 있을 때, 중위도 관측자는 하루 2번의 만조 중 1번은 팽창부 중심 부근을 지나고 12시간 뒤에는 팽창부 가장자리를 지나게 되어 두 만조의 높이가 다른 일조부등(Diurnal Inequality)이 나타납니다.',
    expectedBehavior: '조위 곡선 그래프에서 하루 중 두 개의 만조 봉우리 높이가 뚜렷하게 차이 납니다.',
  },
  {
    id: 'equator-symmetric',
    title: '적도 관측자 (Equator)',
    subtitle: '위도 0° / 대칭적 반일주조',
    tab: 'earth-moon',
    latitude: 0,
    moonDeclination: 0,
    description:
      '달이 천구의 적도면에 위치할 때, 적도상의 관측자는 24시간 동안 완벽하게 대칭인 두 개의 조석 팽창 타원 중심을 차례로 통과합니다. 따라서 두 번의 만조와 간조 높이가 거의 완벽하게 일치하는 정규 반일주조(Semidiurnal Tide)가 발생합니다.',
    expectedBehavior: '조위 곡선에서 12시간 25분 간격으로 높이가 완벽히 같은 만조가 2회 반복됩니다.',
  },
  {
    id: 'high-lat-diurnal',
    title: '고위도 해역 (High Latitude)',
    subtitle: '위도 65° / 일주조 발생',
    tab: 'earth-moon',
    latitude: 65,
    moonDeclination: 28.0,
    description:
      '달의 적위가 크게 기울어진 상태에서 고위도 지역에서는 조석 팽창 타원의 한쪽 자락만 스치듯 지나가게 되어, 하루에 만조가 단 1회만 관측되는 일주조(Diurnal Tide) 현상이 관측됩니다.',
    expectedBehavior: '조위 곡선에서 하루에 단 하나의 뚜렷한 만조 봉우리만 관측됩니다.',
  },
  {
    id: 'spring-tide',
    title: '사리 (대조 / Spring Tide)',
    subtitle: '태양-지구-달 일직선 (합삭/망)',
    tab: 'sun-earth-moon',
    latitude: 37.5,
    moonDeclination: 10.0,
    timeHours: 0, // Syzygy
    description:
      '태양, 지구, 달이 일직선상에 정렬(그믐달 또는 보름달)될 때, 달의 기조력(약 68%)과 태양의 기조력(약 32%)이 합쳐져 조차가 한 달 중 가장 커지는 사리(대조)가 발생합니다. 서해안의 갯벌이 가장 넓게 드러나는 시기입니다.',
    expectedBehavior: '만조 수위는 최고로 높아지고 간조 수위는 최대로 낮아져 최대 조차를 기록합니다.',
  },
  {
    id: 'neap-tide',
    title: '조금 (소조 / Neap Tide)',
    subtitle: '태양-지구-달 직각 (상현/하현)',
    tab: 'sun-earth-moon',
    latitude: 37.5,
    moonDeclination: 10.0,
    timeHours: 7.38 * 24, // Quadrature (~7.4 days)
    description:
      '태양과 달이 지구를 중심으로 90° 직각을 이루는 상현달 또는 하현달일 때, 달의 기조력과 태양의 기조력이 서로 상쇄되어 조차가 한 달 중 가장 작아지는 조금(소조)이 발생합니다.',
    expectedBehavior: '만조와 간조의 수위 차이(조차)가 평소의 절반 이하로 대폭 축소됩니다.',
  },
];

/**
 * Standard default set of comparison latitudes covering key tidal regimes
 */
export const DEFAULT_COMPARISON_LATITUDES: LatitudeTarget[] = [
  {
    id: 'equator',
    name: '적도 (Equator)',
    latitude: 0,
    color: '#06b6d4', // Cyan
    enabled: true,
    description: '반일주조: 12h 25m 주기로 동일한 높이의 두 만조 발생',
  },
  {
    id: 'korea',
    name: '대한민국 중위도 (Seoul/Incheon)',
    latitude: 37.5,
    color: '#f59e0b', // Amber
    enabled: true,
    description: '혼합조 / 일조부등: 두 만조의 높이가 다른 뚜렷한 일조부등',
  },
  {
    id: 'high-lat',
    name: '고위도 (Alaska / Norway)',
    latitude: 65,
    color: '#a855f7', // Purple
    enabled: true,
    description: '일주조 우세: 하루에 만조가 1번만 뚜렷하게 관측',
  },
  {
    id: 'polar',
    name: '극지방 (North Pole)',
    latitude: 90,
    color: '#10b981', // Emerald
    enabled: true,
    description: '극지 조석: 자전축상에 위치하여 일일 조차가 거의 0m에 수렴',
  },
];

/**
 * Classifies the tidal regime based on diurnal inequality, range and latitude
 */
export function getTideClassification(
  latitude: number,
  diurnalInequality: number,
  tidalRange: number
): {
  type: 'semidiurnal' | 'mixed' | 'diurnal' | 'polar';
  label: string;
  badgeColor: string;
  explanation: string;
} {
  const absLat = Math.abs(latitude);

  if (absLat >= 85 || tidalRange < 0.25) {
    return {
      type: 'polar',
      label: '극지 미약 조석 (Polar)',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      explanation: '지구 자전축 바로 위에 있어 일일 자전에 따른 조차 변화가 거의 없습니다.',
    };
  }

  if (diurnalInequality < 0.25 || absLat < 5) {
    return {
      type: 'semidiurnal',
      label: '정규 반일주조 (Semidiurnal)',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      explanation: '하루 두 번의 만조와 간조 높이가 거의 완벽하게 일치합니다.',
    };
  }

  if (diurnalInequality > 1.8 || absLat > 58) {
    return {
      type: 'diurnal',
      label: '일주조 우세 (Diurnal)',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      explanation: '팽창부의 한쪽 끝자락만 스쳐 하루에 단 1회만 뚜렷한 만조가 관측됩니다.',
    };
  }

  return {
    type: 'mixed',
    label: '혼합조 (Mixed / 일조부등)',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    explanation: '하루 2회 만조가 발생하지만 두 만조의 수위가 뚜렷하게 다른 일조부등이 나타납니다.',
  };
}

