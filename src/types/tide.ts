/**
 * Types and interfaces for the Tidal Physics Educational Simulation
 */

export type AppTab = 'earth-moon' | 'sun-earth-moon' | 'multi-latitude' | 'coastal-view' | 'guide';

export interface LatitudeTarget {
  id: string;
  name: string;
  latitude: number; // -90 to +90
  color: string;
  enabled: boolean;
  description?: string;
}

export type ViewMode = 'orbital' | 'cross-section' | 'vectors';

export type VectorDisplayMode = 'net-tidal' | 'components' | 'tractive';

export interface SimulationParams {
  latitude: number; // -90 to +90 degrees
  moonDeclination: number; // -28.5 to +28.5 degrees
  moonDistanceRatio: number; // 0.85 to 1.15 (perigee to apogee)
  sunActive: boolean;
  sunAngle: number; // fixed at 0 rad (right side) in Sun-Earth-Moon frame
  speedMultiplier: number; // simulation speed multiplier
  isPlaying: boolean;
  timeHours: number; // elapsed hours since start
}

export interface TideState {
  currentHeight: number; // meters relative to mean sea level
  maxHeightToday: number;
  minHeightToday: number;
  tidalRange: number; // 조차 (max - min)
  isFlooding: boolean; // 창조 (밀물: rising)
  isEbbing: boolean; // 낙조 (썰물: falling)
  floodEbbRate: number; // m/hour
  moonPhaseAngle: number; // rad (0 = New Moon 삭, PI/2 = First Quarter 상현, PI = Full Moon 망, 3PI/2 = Third Quarter 하현)
  moonPhaseName: string;
  moonIllumination: number; // 0 to 1
  lunarTidalMagnitude: number; // relative force units
  solarTidalMagnitude: number;
  combinedTidalMagnitude: number;
  tideCategory: 'spring' | 'neap' | 'intermediate';
  tideCategoryName: string; // 사리(대조), 조금(소조), 중조
  diurnalInequality: number; // height diff between two consecutive high tides
}

export interface TideDataPoint {
  timeHours: number;
  lunarHeight: number;
  solarHeight: number;
  totalHeight: number;
  isHighTide?: boolean;
  isLowTide?: boolean;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  subtitle: string;
  tab: AppTab;
  latitude: number;
  moonDeclination: number;
  timeHours?: number;
  description: string;
  expectedBehavior: string;
}
