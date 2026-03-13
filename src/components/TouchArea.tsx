import React, { useState, useEffect, useCallback, useRef } from "react";
import { Settings } from "lucide-react";
import { useMultiTouch } from "../hooks/useMultiTouch";
import { useStabilization } from "../hooks/useStabilization";
import { useSelection, type SelectionResult } from "../hooks/useSelection";
import { useSound } from "../hooks/useSound";
import { useSettings } from "../contexts/SettingsContext";
import FingerCircle from "./FingerCircle";
import Confetti from "./Confetti";
import AmbientParticles from "./AmbientParticles";
import SettingsModal from "./SettingsModal";

type AppState = "idle" | "detecting" | "stabilizing" | "selecting" | "result";

const MODE_LABELS: Record<string, string> = {
  "pick-one": "1명 선택",
  "pick-n": "N명 선택",
  teams: "팀 나누기",
  order: "순서 정하기",
};

const TouchArea: React.FC = () => {
  const { settings } = useSettings();
  const { touches, handlers, resetColorMap } = useMultiTouch();
  const { isStable, progress, isCountingDown, reset: resetStabilization } = useStabilization(
    touches,
    settings.waitTime
  );
  const { select } = useSelection();
  const { playWinnerFanfare } = useSound(settings.soundEnabled);

  const [appState, setAppState] = useState<AppState>("idle");
  const [selectionResult, setSelectionResult] = useState<SelectionResult | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [resultCountdown, setResultCountdown] = useState<number | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectionTouchesRef = useRef(touches);

  // Desktop detection
  useEffect(() => {
    const isTouchDevice =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;
    setIsDesktop(!isTouchDevice);
  }, []);

  // State transitions
  useEffect(() => {
    if (appState === "selecting" || appState === "result") return;

    if (touches.length === 0) {
      setAppState("idle");
    } else if (touches.length === 1) {
      setAppState("detecting");
    } else {
      setAppState(isCountingDown || progress > 0 ? "stabilizing" : "detecting");
    }
  }, [touches.length, progress, isCountingDown, appState]);

  const doReset = useCallback(() => {
    if (autoResetTimerRef.current) { clearTimeout(autoResetTimerRef.current); autoResetTimerRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    if (resetTimerRef.current) { clearTimeout(resetTimerRef.current); resetTimerRef.current = null; }
    setResultCountdown(null);
    setAppState("idle");
    setSelectionResult(null);
    resetStabilization();
    resetColorMap();
  }, [resetStabilization, resetColorMap]);

  // Selection trigger
  useEffect(() => {
    if (isStable && appState === "stabilizing") {
      setAppState("selecting");
      selectionTouchesRef.current = [...touches];
      const result = select(touches, settings.mode, settings.pickCount);
      
      // Vibration
      if (settings.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(200);
      }

      // Delay to show pulse, then reveal
      setTimeout(() => {
        setSelectionResult(result);
        setAppState("result");
        setShowConfetti(true);
        playWinnerFanfare();
        setTimeout(() => setShowConfetti(false), 2000);

        // Start 3-second auto-reset countdown (NEVER cleared except by doReset)
        setResultCountdown(3);
        countdownIntervalRef.current = setInterval(() => {
          setResultCountdown(prev => {
            if (prev === null || prev <= 1) return prev;
            return prev - 1;
          });
        }, 1000);
        autoResetTimerRef.current = setTimeout(() => {
          doReset();
        }, 3000);
      }, 600);
    }
  }, [isStable, appState, touches, select, settings, playWinnerFanfare, doReset]);

  // Faster reset if all fingers removed during result (1s)
  // NOTE: 3s safety timer is NEVER cleared here — only doReset clears it
  useEffect(() => {
    if (appState === "result" && touches.length === 0) {
      // Add a faster 1s reset, but keep the 3s safety net intact
      if (!resetTimerRef.current) {
        resetTimerRef.current = setTimeout(() => {
          doReset();
        }, 1000);
      }
    }
    if (appState === "result" && touches.length > 0) {
      // Cancel only the fast reset if fingers come back
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    }
  }, [appState, touches.length, doReset]);

  // Screen rotation reset
  useEffect(() => {
    const handleResize = () => {
      if (appState !== "idle") {
        setAppState("idle");
        setSelectionResult(null);
        resetStabilization();
      }
    };
    window.addEventListener("orientationchange", handleResize);
    return () => window.removeEventListener("orientationchange", handleResize);
  }, [appState, resetStabilization]);

  const getFingerState = useCallback(
    (index: number) => {
      if (appState === "selecting") return "pulsing" as const;
      if (appState === "result" && selectionResult) {
        if (settings.mode === "teams" && selectionResult.teams) {
          if (selectionResult.teams.a.includes(index)) return "team-a" as const;
          if (selectionResult.teams.b.includes(index)) return "team-b" as const;
        }
        if (settings.mode === "order") return "active" as const;
        if (selectionResult.winners.includes(index)) return "winner" as const;
        return "loser" as const;
      }
      if (appState === "stabilizing") return "stabilizing" as const;
      return "active" as const;
    },
    [appState, selectionResult, settings.mode]
  );

  const displayTouches =
    appState === "result" || appState === "selecting"
      ? selectionTouchesRef.current
      : touches;

  if (isDesktop) {
    return (
      <div className="fixed inset-0 flex items-center justify-center touch-area" style={{ background: "var(--gradient-bg)" }}>
        <div className="text-center px-8">
          <div className="text-6xl mb-6">📱</div>
          <h1 className="text-2xl font-bold text-foreground mb-3">모바일 기기에서 사용해주세요</h1>
          <p className="text-muted-foreground">
            이 앱은 터치스크린이 필요합니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 touch-area overflow-hidden"
        style={{ background: "var(--gradient-bg)" }}
        {...handlers}
      >
        {/* Ambient particles */}
        {appState === "idle" && <AmbientParticles />}


        {/* Idle state */}
        {appState === "idle" && touches.length === 0 && (
          <>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <h1
                className="text-5xl font-extrabold tracking-tight mb-6 animate-pulse"
                style={{
                  color: "hsl(280 100% 75%)",
                  textShadow:
                    "0 0 10px hsl(280 100% 65% / 0.8), 0 0 30px hsl(280 100% 60% / 0.6), 0 0 60px hsl(320 100% 60% / 0.4), 0 0 100px hsl(200 100% 60% / 0.2)",
                }}
              >
                마곡픽!
              </h1>
              <div className="animate-float-up">
                <div className="text-7xl mb-8">👆</div>
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                화면에 손가락을 올려주세요
              </p>
              <p className="text-sm text-muted-foreground">
                {MODE_LABELS[settings.mode]} 모드
              </p>
            </div>
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <p className="text-xs text-muted-foreground/50">
                MIT License · Made by 오규성 · <a href="mailto:ogs2222@lgcns.com" className="underline">ogs2222@lgcns.com</a>
              </p>
            </div>
          </>
        )}

        {/* Single finger warning */}
        {touches.length === 1 && appState === "detecting" && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center">
            <div className="px-4 py-2 rounded-full bg-muted/40 backdrop-blur-sm animate-fade-in">
              <span className="text-sm text-muted-foreground">한 명 더 필요해요! ☝️</span>
            </div>
          </div>
        )}

        {/* Finger count */}
        {touches.length > 0 && appState !== "result" && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
            <div className="px-4 py-2 rounded-full bg-muted/30 backdrop-blur-sm">
              <span className="text-sm text-muted-foreground font-medium">
                {touches.length}명 참여 중
              </span>
            </div>
          </div>
        )}

        {/* Finger circles */}
        {displayTouches.map((touch, index) => (
          <FingerCircle
            key={touch.id}
            x={touch.x}
            y={touch.y}
            colorIndex={touch.colorIndex}
            state={getFingerState(index)}
            progress={appState === "stabilizing" ? progress : 0}
            orderNumber={
              appState === "result" &&
              settings.mode === "order" &&
              selectionResult?.order
                ? selectionResult.order[index]
                : undefined
            }
            delay={
              getFingerState(index) === "loser"
                ? (selectionResult?.winners.indexOf(index) === -1
                    ? index * 150
                    : 0)
                : 0
            }
          />
        ))}

        {/* Confetti */}
        {showConfetti &&
          selectionResult &&
          (settings.mode === "pick-one" || settings.mode === "pick-n") &&
          selectionResult.winners.map((wi) => {
            const t = displayTouches[wi];
            return t ? <Confetti key={wi} x={t.x} y={t.y} /> : null;
          })}

        {/* Result countdown timer */}
        {appState === "result" && resultCountdown !== null && (
          <div className="absolute top-12 left-0 right-0 flex justify-center pointer-events-none z-50">
            <div className="px-5 py-2 rounded-full bg-muted/40 backdrop-blur-sm">
              <span className="text-sm text-muted-foreground font-medium">
                {resultCountdown}초 후 초기화
              </span>
            </div>
          </div>
        )}
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default TouchArea;
