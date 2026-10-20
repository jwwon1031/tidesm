import React, { useState } from 'react';
import { X, BookOpen, Compass, Waves, Sun, Moon, ArrowRight, CheckCircle2 } from 'lucide-react';

interface EducationalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationalModal: React.FC<EducationalModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<number>(0);

  if (!isOpen) return null;

  const sections = [
    {
      id: 'tidal-force',
      title: '1. 기조력(차등 중력)의 발생 원리',
      tag: '물리적 기초',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            <strong className="text-white">기조력(Tide-generating Force)</strong>이란 천체(달이나 태양)가 지구 표면의 물체에 미치는 <b>만유인력</b>과, 지구 중심이 받는 <b>평균 인력(=공전 원심력)</b>의 <b>벡터 차이(차등 중력, Differential Gravity)</b>입니다.
          </p>

          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
            <div className="text-cyan-400 font-semibold">수학적 정의 (차등 중력 공식):</div>
            <div className="text-slate-200">
              F_tide = F_g(표면) - F_c(중심) ≈ G · M · r / R³
            </div>
            <div className="text-slate-400 text-[11px]">
              * M: 달/태양의 질량, r: 지구 반지름, R: 천체와의 거리
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl">
              <div className="font-semibold text-cyan-300 text-xs mb-1">달을 향한 쪽 (직하점)</div>
              <div className="text-[12px] text-slate-300">
                달과의 거리가 가까워 만유인력이 중심보다 큽니다. 알짜 기조력이 <b>달 쪽 바깥으로</b> 작용하여 해수가 솟아오릅니다.
              </div>
            </div>

            <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl">
              <div className="font-semibold text-indigo-300 text-xs mb-1">달의 반대쪽 (대척점)</div>
              <div className="text-[12px] text-slate-300">
                달과의 거리가 멀어 만유인력이 중심보다 약합니다. 원심력이 인력을 이겨서 <b>달 반대쪽 바깥으로</b> 팽창합니다.
              </div>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl">
              <div className="font-semibold text-amber-300 text-xs mb-1">달과 90° 직각인 곳</div>
              <div className="text-[12px] text-slate-300">
                인력과 원심력의 합력이 지구 중심을 향해 누르며, 해수가 팽창부로 빠져나가 <b>해수면이 낮아지는 간조</b>가 됩니다.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'twice-daily',
      title: '2. 왜 하루에 만조가 2번 생길까?',
      tag: '지구 자전과 조석',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            기조력에 의해 지구의 바다는 달을 향한 쪽뿐만 아니라 <b>반대편 쪽으로도 동시에 럭비공처럼 부풀어 오르는 두 개의 팽창부(Tidal Bulge)</b>를 형성합니다.
          </p>

          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
            <div className="font-semibold text-slate-100 text-xs">관측자의 시선:</div>
            <p className="text-xs text-slate-300">
              지구가 자전축을 중심으로 24시간 동안 한 바퀴(360°) 자전하는 동안, 지구 표면에 있는 관측자는 이 <b>두 개의 팽창 타원을 차례로 통과</b>하게 됩니다.
            </p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>첫 번째 팽창부 통과: <b>제1 만조</b> (달 쪽)</li>
              <li>중간 통과: <b>제1 간조</b> (90° 지점)</li>
              <li>약 12시간 25분 후 두 번째 팽창부 통과: <b>제2 만조</b> (달 반대쪽)</li>
              <li>중간 통과: <b>제2 간조</b></li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'fifty-minutes',
      title: '3. 만조 시각이 매일 50분씩 늦어지는 이유',
      tag: '달의 공전 효과',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            지구가 1회 자전(24시간)하는 동안, 달도 가만히 멈춰 있지 않고 지구 주위를 같은 방향(서쪽에서 동쪽, 반시계 방향)으로 공전합니다.
          </p>

          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 font-mono text-xs space-y-2">
            <div className="text-cyan-400 font-semibold">공전 각도 및 지연 시간 계산:</div>
            <div>• 달의 공전 주기: 약 27.3일</div>
            <div>• 달이 24시간 동안 전진하는 공전 각도: 360° / 27.3 ≈ <b>13.18°</b></div>
            <div>• 지구가 13.18°를 더 자전하는 데 걸리는 시간: 13.18° × (24h / 360°) ≈ <b>약 50분</b></div>
          </div>

          <p>
            따라서 지구가 하루 전의 위치로 돌아와도 달은 이미 13.2° 앞서가 있으므로, 지구가 50분을 더 돌아야 달과 다시 정면으로 마주보게 됩니다. 이로 인해 <b>태음일(Lunar Day)은 24시간 50분</b>이며, 만조 시각은 매일 약 50분씩 늦어집니다.
          </p>
        </div>
      ),
    },
    {
      id: 'diurnal-inequality',
      title: '4. 일조부등과 위도별 조석 형태',
      tag: '적위와 위도의 상호작용',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            달의 공전 궤도면(백도)은 지구의 적도면과 일치하지 않고 최대 <b>28.5°까지 경사(적위, Declination)</b>져 있습니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="font-semibold text-amber-300 text-xs mb-1">일조부등 (Diurnal Inequality)</div>
              <p className="text-[12px] text-slate-300">
                조석 팽창축이 기울어지면, 중위도(한국 등) 관측자는 하루 두 번의 만조 중 하나는 팽창 타원의 중심부(높은 만조, 고고조)를 지나고, 12시간 뒤에는 팽창부의 가장자리(낮은 만조, 저고조)를 지나게 되어 두 만조의 높이가 달라집니다.
              </p>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="font-semibold text-cyan-300 text-xs mb-1">위도에 따른 조석 형태</div>
              <ul className="text-[12px] text-slate-300 space-y-1 list-disc list-inside">
                <li><b>적도 (φ = 0°):</b> 대칭적 정규 <b>반일주조</b> (두 만조 높이 동일)</li>
                <li><b>중위도 (φ = 30°~50°):</b> 뚜렷한 <b>혼합조 / 일조부등</b></li>
                <li><b>고위도 (φ &gt; 60°):</b> 팽창부 한쪽만 스쳐 하루 1회 만조인 <b>일주조</b></li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'spring-neap',
      title: '5. 사리(대조)와 조금(소조)의 천체 정렬',
      tag: '태양 기조력과의 합성',
      content: (
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            태양의 기조력은 달 기조력의 약 <b>46% (전체 중 약 31.5%)</b>를 차지합니다. 달이 지구를 공전함에 따라 태양-지구-달의 기하학적 각도가 변하면서 두 기조력의 합성 효과가 달라집니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl">
              <div className="font-semibold text-cyan-300 text-xs mb-1">사리 (대조 / Spring Tide)</div>
              <p className="text-[12px] text-slate-300 mb-1">
                <b>삭(그믐달)과 망(보름달)</b> 시기, 태양-지구-달이 일직선(합삭/망)을 이룹니다.
              </p>
              <p className="text-[11px] text-cyan-200">
                달과 태양의 팽창축이 일치하여 두 기조력이 더해집니다 (1.0 + 0.46 = 1.46). <b>조차가 한 달 중 최대</b>가 되며 서해안 갯벌이 가장 넓게 열립니다.
              </p>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl">
              <div className="font-semibold text-amber-300 text-xs mb-1">조금 (소조 / Neap Tide)</div>
              <p className="text-[12px] text-slate-300 mb-1">
                <b>상현달과 하현달</b> 시기, 태양과 달이 지구를 중심으로 직각(90°)을 이룹니다.
              </p>
              <p className="text-[11px] text-amber-200">
                달의 팽창부와 태양의 팽창부가 서로 상쇄되어 (1.0 - 0.46 = 0.54) <b>조차가 한 달 중 최소</b>로 줄어듭니다.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">조석 현상 과학 원리 탐구</h2>
              <p className="text-xs text-slate-400">지구과학 핵심 개념 가이드</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex overflow-x-auto gap-1 p-2 bg-slate-950/50 border-b border-slate-800/80 scrollbar-none">
          {sections.map((sec, idx) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(idx)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeSection === idx
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {sec.title}
            </button>
          ))}
        </div>

        {/* Section Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              {sections[activeSection].tag}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white">
            {sections[activeSection].title}
          </h3>

          {sections[activeSection].content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70">
          <div className="text-xs text-slate-400">
            {activeSection + 1} / {sections.length} 주제
          </div>
          <div className="flex items-center gap-2">
            {activeSection > 0 && (
              <button
                type="button"
                onClick={() => setActiveSection((prev) => prev - 1)}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                이전 주제
              </button>
            )}
            {activeSection < sections.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveSection((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
              >
                <span>다음 주제</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
              >
                <span>학습 완료</span>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
