/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AppTab,
  LatitudeTarget,
  ScenarioPreset,
  SimulationParams,
  VectorDisplayMode,
  ViewMode,
} from './types/tide';
import { DEFAULT_COMPARISON_LATITUDES, getCurrentTideState } from './utils/tidePhysics';
import { Navbar } from './components/Navbar';
import { EarthMoonCanvas } from './components/EarthMoonCanvas';
import { SunEarthMoonCanvas } from './components/SunEarthMoonCanvas';
import { CoastalSceneCanvas } from './components/CoastalSceneCanvas';
import { MultiLatitudeComparison } from './components/MultiLatitudeComparison';
import { TideGraph } from './components/TideGraph';
import { SimulationControls } from './components/SimulationControls';
import { ParametersPanel } from './components/ParametersPanel';
import { EducationalModal } from './components/EducationalModal';
import { Info, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  // Current active tab
  const [currentTab, setCurrentTab] = useState<AppTab>('earth-moon');

  // Simulation parameters
  const [params, setParams] = useState<SimulationParams>({
    latitude: 37.5, // Default Seoul / Incheon mid-latitude
    moonDeclination: 23.5, // 23.5° declination producing diurnal inequality
    moonDistanceRatio: 1.0,
    sunActive: false, // Default false for Earth-Moon tab
    sunAngle: 0,
    speedMultiplier: 1.0,
    isPlaying: true, // Auto-play by default for lively visualization
    timeHours: 0,
  });

  // Earth-Moon canvas sub-views
  const [viewMode, setViewMode] = useState<ViewMode>('orbital');
  const [vectorMode, setVectorMode] = useState<VectorDisplayMode>('net-tidal');

  // Educational modal state
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Active preset notification banner
  const [activePreset, setActivePreset] = useState<ScenarioPreset | null>(null);

  // Multi-latitude comparison targets
  const [comparisonLatitudes, setComparisonLatitudes] = useState<LatitudeTarget[]>(
    DEFAULT_COMPARISON_LATITUDES
  );

  // Update helper
  const handleUpdateParams = useCallback((partial: Partial<SimulationParams>) => {
    setParams((prev) => ({ ...prev, ...partial }));
  }, []);

  // When tab changes, automatically adapt sunActive appropriately
  const handleSelectTab = useCallback((tab: AppTab) => {
    setCurrentTab(tab);
    if (tab === 'sun-earth-moon') {
      setParams((prev) => ({ ...prev, sunActive: true }));
    } else if (tab === 'earth-moon') {
      setParams((prev) => ({ ...prev, sunActive: false }));
    }
  }, []);

  // Preset selection handler
  const handleSelectPreset = useCallback((preset: ScenarioPreset) => {
    setActivePreset(preset);
    handleSelectTab(preset.tab);
    setParams((prev) => ({
      ...prev,
      latitude: preset.latitude,
      moonDeclination: preset.moonDeclination,
      timeHours: preset.timeHours !== undefined ? preset.timeHours : prev.timeHours,
      isPlaying: true,
      sunActive: preset.tab === 'sun-earth-moon',
    }));
  }, [handleSelectTab]);

  // Step time
  const handleStepTime = useCallback((deltaHours: number) => {
    setParams((prev) => ({
      ...prev,
      timeHours: Math.max(0, prev.timeHours + deltaHours),
    }));
  }, []);

  // Reset time
  const handleResetTime = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      timeHours: 0,
    }));
  }, []);

  // Seek time directly
  const handleSeekTime = useCallback((targetHours: number) => {
    setParams((prev) => ({
      ...prev,
      timeHours: targetHours,
    }));
  }, []);

  // Animation Loop (requestAnimationFrame)
  // 1x speed means 1 real second = 1.0 hour in simulation
  const lastTimeRef = useRef<number>(performance.now());
  useEffect(() => {
    let animId: number;

    const loop = (now: number) => {
      const dtMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Clamp dt to avoid huge jumps on tab switch
      const dtSec = Math.min(0.1, dtMs / 1000);

      if (params.isPlaying) {
        const deltaHours = dtSec * params.speedMultiplier * 1.0;
        setParams((prev) => ({
          ...prev,
          timeHours: prev.timeHours + deltaHours,
        }));
      }

      animId = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [params.isPlaying, params.speedMultiplier]);

  // Keyboard shortcut: Spacebar to toggle Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setParams((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate current real-time tide physics state
  const currentTideState = getCurrentTideState(params.timeHours, params);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onSelectPreset={handleSelectPreset}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Container (Max width 1440px baseline) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Scenario Banner if active */}
        {activePreset && (
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-xs text-slate-200">
            <div className="flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-cyan-300">
                  [{activePreset.title}] 탐구 진행 중:
                </span>{' '}
                <span className="text-slate-300">{activePreset.description}</span>
                <div className="mt-1 text-cyan-400/90 font-medium">
                  {activePreset.expectedBehavior}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActivePreset(null)}
              className="text-[11px] text-slate-400 hover:text-white underline whitespace-nowrap shrink-0"
            >
              알림 닫기
            </button>
          </div>
        )}

        {/* Multi-Latitude Comparison Tab Content */}
        {currentTab === 'multi-latitude' && (
          <MultiLatitudeComparison
            params={params}
            latitudes={comparisonLatitudes}
            onUpdateLatitudes={setComparisonLatitudes}
            onSeekTime={handleSeekTime}
          />
        )}

        {/* Single Exploration Tabs Content */}
        {currentTab !== 'multi-latitude' && (
          <>
            {/* Top Split Stage: Visual Canvas (Left ~65%) + Parameter Controls (Right ~35%) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Visual Simulation Stage (lg:col-span-8) */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {currentTab === 'earth-moon' && (
                  <EarthMoonCanvas
                    params={params}
                    viewMode={viewMode}
                    onChangeViewMode={setViewMode}
                    vectorMode={vectorMode}
                    onChangeVectorMode={setVectorMode}
                  />
                )}

                {currentTab === 'sun-earth-moon' && (
                  <SunEarthMoonCanvas
                    params={params}
                    tideState={currentTideState}
                  />
                )}

                {currentTab === 'coastal-view' && (
                  <CoastalSceneCanvas
                    params={params}
                    tideState={currentTideState}
                  />
                )}
              </div>

              {/* Right Parameters Deck (lg:col-span-4) */}
              <div className="lg:col-span-4 flex flex-col">
                <ParametersPanel
                  params={params}
                  tideState={currentTideState}
                  onUpdateParams={handleUpdateParams}
                />
              </div>
            </div>

            {/* Real-Time Tide Curve Graph Section */}
            <div className="w-full">
              <TideGraph
                params={params}
                tideState={currentTideState}
                onSeekTime={handleSeekTime}
              />
            </div>
          </>
        )}

        {/* Sticky/Floating Timeline & Playback Controller */}
        <div className="sticky bottom-4 z-30 w-full">
          <SimulationControls
            params={params}
            onUpdateParams={handleUpdateParams}
            onStepTime={handleStepTime}
            onResetTime={handleResetTime}
          />
        </div>

        {/* Educational Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-900 text-xs text-slate-400">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>하루 2회 만조와 50분 지연</span>
            </div>
            <p className="leading-relaxed">
              달 쪽과 반대쪽에 생기는 2개의 팽창 타원을 지구가 자전하며 통과하여 12시간 25분마다 만조가 발생하며, 달의 공전으로 인해 매일 약 50분씩 늦어집니다.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>일조부등 (Diurnal Inequality)</span>
            </div>
            <p className="leading-relaxed">
              달의 적위(δ)가 기울어져 있을 때, 중위도 관측자는 팽창 타원의 중심과 외곽을 번갈아 지나므로 하루 중 두 번의 만조 높이가 서로 달라집니다.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>사리(대조)와 조금(소조)</span>
            </div>
            <p className="leading-relaxed">
              그믐/보름에는 태양과 달의 기조력이 합쳐져 조차가 최대(사리)가 되고, 상현/하현에는 기조력이 90°로 상쇄되어 조차가 최소(조금)가 됩니다.
            </p>
          </div>
        </div>
      </main>

      {/* Educational Guide Modal */}
      <EducationalModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
