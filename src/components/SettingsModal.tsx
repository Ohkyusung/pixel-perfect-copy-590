import React from "react";
import { useSettings, type GameMode } from "../contexts/SettingsContext";
import { Settings, X, Volume2, VolumeX, Smartphone } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const modes: { value: GameMode; label: string; desc: string }[] = [
  { value: "pick-one", label: "1명 선택", desc: "한 명을 랜덤으로" },
  { value: "pick-n", label: "N명 선택", desc: "여러 명을 선택" },
  { value: "teams", label: "팀 나누기", desc: "두 팀으로 나누기" },
  { value: "order", label: "순서 정하기", desc: "순서를 정해요" },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { settings, updateSettings } = useSettings();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-3xl p-6 pb-10 animate-fade-in"
        style={{ background: "hsl(240 15% 12%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">설정</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Mode selection */}
        <div className="mb-5">
          <p className="text-sm text-muted-foreground mb-3">모드</p>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((m) => (
              <button
                key={m.value}
                onClick={() => updateSettings({ mode: m.value })}
                className={`p-3 rounded-xl text-left transition-all ${
                  settings.mode === m.value
                    ? "bg-primary/20 border-2 border-primary"
                    : "bg-muted/50 border-2 border-transparent"
                }`}
              >
                <span className="text-sm font-semibold text-foreground">{m.label}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Pick count for N mode */}
        {settings.mode === "pick-n" && (
          <div className="mb-5">
            <p className="text-sm text-muted-foreground mb-3">선택 인원</p>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => updateSettings({ pickCount: n })}
                  className={`w-12 h-12 rounded-xl text-sm font-bold transition-all ${
                    settings.pickCount === n
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground"
                  }`}
                >
                  {n}명
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Wait time */}
        <div className="mb-5">
          <p className="text-sm text-muted-foreground mb-3">대기 시간</p>
          <div className="flex gap-2">
            {[1, 2, 3].map((t) => (
              <button
                key={t}
                onClick={() => updateSettings({ waitTime: t })}
                className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${
                  settings.waitTime === t
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted/50 text-foreground"
                }`}
              >
                {t}초
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-3">
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
              settings.soundEnabled
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-muted/50 text-muted-foreground border border-transparent"
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            소리
          </button>
          <button
            onClick={() => updateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
            className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
              settings.vibrationEnabled
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-muted/50 text-muted-foreground border border-transparent"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            진동
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
