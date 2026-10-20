import React from 'react';
import { AppTab, ScenarioPreset } from '../types/tide';
import { SCENARIO_PRESETS } from '../utils/tidePhysics';
import { Compass, BookOpen, Sun, Moon, Anchor, Sparkles, GitCompare } from 'lucide-react';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onSelectPreset: (preset: ScenarioPreset) => void;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onSelectPreset,
  onOpenGuide,
}) => {
  const [isPresetMenuOpen, setIsPresetMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark with icon */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              조석 시뮬레이터
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-mono text-cyan-400/80">
              Tide Simulator
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Segmented Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onSelectTab('earth-moon')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'earth-moon'
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Moon className="h-4 w-4 text-cyan-400" />
            <span>지구-달 계</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('sun-earth-moon')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'sun-earth-moon'
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sun className="h-4 w-4 text-amber-400" />
            <span>태양-지구-달 (사리·조금)</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('multi-latitude')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'multi-latitude'
                ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <GitCompare className="h-4 w-4 text-purple-400" />
            <span>위도별 비교</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('coastal-view')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'coastal-view'
                ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Anchor className="h-4 w-4 text-emerald-400" />
            <span className="hidden md:inline">해안 조석 체감 뷰</span>
            <span className="md:hidden">해안 뷰</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action: Preset Selector & Educational Guide */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>탐구 시나리오</span>
            </button>

            {isPresetMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsPresetMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-slate-800 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-lg z-50">
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    추천 교육 실험 시나리오
                  </div>
                  <div className="space-y-0.5">
                    {SCENARIO_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          onSelectPreset(preset);
                          setIsPresetMenuOpen(false);
                        }}
                        className="w-full rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-slate-800/80 group"
                      >
                        <div className="font-medium text-slate-200 group-hover:text-cyan-300">
                          {preset.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {preset.subtitle}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-500 whitespace-nowrap shrink-0 shadow-sm shadow-cyan-950"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>원리 탐구</span>
          </button>
        </div>
      </div>
    </header>
  );
};
