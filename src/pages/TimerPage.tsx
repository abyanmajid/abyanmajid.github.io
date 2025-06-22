import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getUnfinishedSession,
  setUnfinishedSession,
  updateLastActive,
  clearUnfinishedSession,
  addSession,
} from "../lib/storage";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  // Optionally set voice, pitch, rate:
  utter.lang = navigator.language;
  // utter.pitch = 1.2;
  // utter.rate = 1;
  window.speechSynthesis.speak(utter);
}

function playToneSequence(sequence: { freq: number; duration: number }[]) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    let currentTime = ctx.currentTime;
    sequence.forEach(({ freq, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine"; // or "triangle", "square" for different timbres
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      // Fade-in/out for smoothness
      gain.gain.setValueAtTime(0, currentTime);
      gain.gain.linearRampToValueAtTime(0.1, currentTime + 0.01);
      gain.gain.setValueAtTime(0.1, currentTime + duration / 1000 - 0.02);
      gain.gain.linearRampToValueAtTime(0, currentTime + duration / 1000);
      osc.start(currentTime);
      osc.stop(currentTime + duration / 1000);
      currentTime += duration / 1000;
    });
    // Close context after all tones
    setTimeout(() => {
      ctx.close();
    }, sequence.reduce((sum, t) => sum + t.duration, 0) + 100);
  } catch {
    // ignore if AudioContext unavailable
  }
}

// Fun sounds for work-end and break-end
function playWorkEndSound() {
  // Ascending tones: e.g., C4, E4, G4
  playToneSequence([
    { freq: 261.6, duration: 150 },
    { freq: 329.6, duration: 150 },
    { freq: 392.0, duration: 300 },
  ]);
}

function playBreakEndSound() {
  // Descending tones: e.g., G4, E4, C4
  playToneSequence([
    { freq: 392.0, duration: 150 },
    { freq: 329.6, duration: 150 },
    { freq: 261.6, duration: 300 },
  ]);
}

/**
 * TimerPage: Pomodoro timer with indefinite cycles,
 * logging each work period into storage.
 */
function TimerPage() {
  // Pomodoro configurations
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const presets = [
    { label: "25/5", work: 25 * 60, rest: 5 * 60 },
    { label: "50/10", work: 50 * 60, rest: 10 * 60 },
  ];

  // Selected preset index, or null if none selected
  const [presetIndex, setPresetIndex] = useState<number | null>(null);

  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0); // seconds

  // Ref to track if component just mounted, to avoid immediate interval action
  const initializedRef = useRef(false);

  // Utility to format seconds as MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  // On mount: recover any unfinished work session
  useEffect(() => {
    const unfinished = getUnfinishedSession();
    if (unfinished) {
      try {
        addSession(unfinished.start, unfinished.lastActive);
      } catch {
        // ignore
      }
      clearUnfinishedSession();
    }
    initializedRef.current = true;
  }, []);

  // Record an unfinished session on unload if in work phase
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isRunning && isWorkPhase) {
        updateLastActive();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isRunning, isWorkPhase]);

  // Effect: manage countdown interval when isRunning true
  useEffect(() => {
    if (!isRunning) return;
    // Decrement timeLeft each second
    const id = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      if (isWorkPhase) {
        updateLastActive();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, isWorkPhase]);

  // Effect: watch timeLeft for transitions
  useEffect(() => {
    // Skip on initial render if not running
    if (!initializedRef.current) return;
    if (!isRunning) return;

    if (timeLeft <= 0) {
      // Time up: transition
      if (presetIndex === null) {
        // No preset: stop
        setIsRunning(false);
        setIsWorkPhase(true);
        return;
      }
      if (isWorkPhase) {
        playWorkEndSound();
        speak("Work session is complete. Time for a break.");

        // Work complete: record session
        const unfinished = getUnfinishedSession();
        const endISO = new Date().toISOString();
        if (unfinished) {
          try {
            addSession(unfinished.start, endISO);
          } catch {
            console.log("");
          }
          clearUnfinishedSession();
        }
        // Start rest
        setIsWorkPhase(false);
        setTimeLeft(presets[presetIndex].rest);
        // keep isRunning true, interval effect handles countdown
      } else {
        playBreakEndSound();
        speak("Break is over. Time to work.");

        // Rest complete: start next work
        // Record no rest session; directly start work
        setIsWorkPhase(true);
        const nowISO = new Date().toISOString();
        setUnfinishedSession(nowISO);
        setTimeLeft(presets[presetIndex].work);
        // isRunning stays true
      }
    }
  }, [timeLeft, isRunning, isWorkPhase, presetIndex, presets]);

  // Handler: user selects a preset and starts timer
  const handlePresetClick = (index: number) => {
    // Stop any existing session
    if (isRunning) {
      handleStop();
    }
    setPresetIndex(index);
    // Start work phase immediately
    const nowISO = new Date().toISOString();
    setUnfinishedSession(nowISO);
    setIsWorkPhase(true);
    setIsRunning(true);
    setTimeLeft(presets[index].work);
  };

  // Handler: Stop button
  const handleStop = useCallback(() => {
    if (isRunning && isWorkPhase) {
      const unfinished = getUnfinishedSession();
      const endISO = new Date().toISOString();
      if (unfinished) {
        try {
          addSession(unfinished.start, endISO);
        } catch {
          console.log("");
        }
        clearUnfinishedSession();
      }
    }
    setIsRunning(false);
    setIsWorkPhase(true);
    // Keep presetIndex so user can restart
  }, [isRunning, isWorkPhase]);

  // Cleanup on unmount: record if running work
  useEffect(() => {
    return () => {
      if (isRunning && isWorkPhase) {
        const unfinished = getUnfinishedSession();
        const endISO = new Date().toISOString();
        if (unfinished) {
          try {
            addSession(unfinished.start, endISO);
          } catch {
            console.log("");
          }
          clearUnfinishedSession();
        }
      }
    };
  }, [isRunning, isWorkPhase]);

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto my-16">
        <h1 className="text-center">Timer</h1>
        <p className="text-center">
          Get the most out of yourself with Pomodoro
        </p>
        <hr />
        {/* Preset buttons */}
        <div role="group" className="flex justify-center gap-4 my-4">
          {presets.map((p, idx) => (
            <button
              key={p.label}
              onClick={() => handlePresetClick(idx)}
              className={presetIndex === idx && isRunning ? "" : "outline"}
            >
              {p.label}
            </button>
          ))}
          {isRunning && (
            <button className="outline secondary ml-4" onClick={handleStop}>
              Stop
            </button>
          )}
        </div>
        {/* Timer display */}
        <article>
          <div className="text-7xl text-center py-4">
            <strong>{formatTime(Math.max(timeLeft, 0))}</strong>
          </div>
          <div className="text-center">
            {isRunning
              ? isWorkPhase
                ? "Work phase"
                : "Break phase"
              : presetIndex !== null
              ? "Paused"
              : "Select a preset to start"}
          </div>
        </article>
        {/* If not running and preset selected, show Start button */}
        {!isRunning && presetIndex !== null && (
          <div className="mt-4 flex justify-center">
            <button
              className="w-full secondary"
              onClick={() => {
                if (presetIndex !== null) {
                  const nowISO = new Date().toISOString();
                  setUnfinishedSession(nowISO);
                  setIsWorkPhase(true);
                  setIsRunning(true);
                  setTimeLeft(presets[presetIndex].work);
                }
              }}
            >
              Start
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default TimerPage;
