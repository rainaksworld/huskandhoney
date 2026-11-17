"use client";

import { useEffect, useRef, useState } from "react";
import { METHODS, type MethodKey } from "@/lib/catalogue";
import { BrewAnim } from "./BrewAnim";
import { QUIZ_METHOD_ICON } from "@/lib/quiz-art";

const METHOD_ORDER: MethodKey[] = ["pour", "french", "moka", "aero", "espresso"];
const PRESETS = [
  { w: 250, cups: "1 cup" },
  { w: 500, cups: "2 cups" },
  { w: 750, cups: "3 cups" },
];

function fmtTime(s: number, dur: number) {
  const sec = Math.max(0, Math.ceil(s));
  if (dur < 60) return `${sec} sec`;
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${r < 10 ? "0" : ""}${r} min`;
}

export function BrewGuide() {
  const [key, setKey] = useState<MethodKey>("pour");
  const [water, setWater] = useState(250);
  const [fading, setFading] = useState(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const m = METHODS[key];
  const coffee = m.ratio ? Math.round((water / m.ratio) * 10) / 10 : 0;

  useEffect(() => {
    return () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    };
  }, []);

  const selectMethod = (next: MethodKey) => {
    if (next === key) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setKey(next);
      return;
    }
    setFading(true);
    if (swapTimer.current) clearTimeout(swapTimer.current);
    swapTimer.current = setTimeout(() => {
      setKey(next);
      setFading(false);
    }, 260);
  };

  return (
    <section className="sec page brewpage" id="brew" aria-labelledby="brew-h">
      <div className="brew-head rv">
        <p className="lab dim">Brew guide</p>
        <h1 className="disp h2" id="brew-h">
          brew it your way.
        </h1>
        <ol className="brew-how" aria-label="How to use the brew guide">
          <li>
            <span className="qnum">1</span>
            <span>
              <b>Pick your brewer.</b> Tap pour over, French press, moka pot, AeroPress or espresso.
            </span>
          </li>
          <li>
            <span className="qnum">2</span>
            <span>
              <b>Set how much you are making.</b> Tap a cup size or drag the water slider. We work out how much
              coffee to weigh.
            </span>
          </li>
          <li>
            <span className="qnum">3</span>
            <span>
              <b>Brew along.</b> Press Start on the timer and follow the steps. It chimes when you are done.
            </span>
          </li>
        </ol>
      </div>

      <div className="brew2">
        <div className="brew-left">
          <div className={`brew-art fx${fading ? " fading" : ""}`} aria-hidden="true">
            <p className="lab brew-art-lab">{m.label}</p>
            <div className="draw">
              <BrewAnim key={key} method={key} />
            </div>
            <p className="brew-art-cap">
              {m.grind} · {m.time}
            </p>
          </div>
        </div>

        <div className="brew-right">
          <fieldset className="opts brew-methods">
            <legend className="lab dim">Your brewer</legend>
            {METHOD_ORDER.map((k) => (
              <label className="chip q-chip" key={k}>
                <input type="radio" name="method" checked={key === k} onChange={() => selectMethod(k)} />
                <span>
                  <svg
                    viewBox="0 0 32 32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: QUIZ_METHOD_ICON[k] }}
                  />
                  {METHODS[k].label}
                </span>
              </label>
            ))}
          </fieldset>

          <div className={`brew-calc fx${fading ? " fading" : ""}`} aria-live="polite">
            <p className="lab dim">Coffee to water, by weight</p>
            <p className="disp ratio">{key === "moka" ? "1 pot" : m.ratio ? `1:${m.ratio}` : "—"}</p>
            {m.fixed ? (
              <p className="lead">{m.fixed}</p>
            ) : (
              <div className="calc">
                <p className="lab">How much water?</p>
                <div className="presets" role="group" aria-label="Quick sizes">
                  {PRESETS.map((p) => (
                    <button
                      key={p.w}
                      className="pbtn"
                      type="button"
                      aria-pressed={water === p.w}
                      onClick={() => setWater(p.w)}
                    >
                      <span>{p.cups}</span>
                      <span className="pml">
                        <i aria-hidden="true"> · </i>
                        {p.w} ml
                      </span>
                    </button>
                  ))}
                </div>
                <label className="lab dim" htmlFor="water">
                  Water: <span>{water}</span> ml
                </label>
                <input
                  type="range"
                  id="water"
                  min={150}
                  max={750}
                  step={50}
                  value={water}
                  onChange={(e) => setWater(Number(e.target.value))}
                />
                <div className="scale lab dim" aria-hidden="true">
                  <span>150 ml</span>
                  <span>450 ml</span>
                  <span>750 ml</span>
                </div>
                <div className="nums">
                  <span>
                    <span className="lab dim">Coffee</span>
                    <b>{coffee.toFixed(1)} g</b>
                  </span>
                  <span>
                    <span className="lab dim">Water</span>
                    <b>{water} g</b>
                  </span>
                </div>
                <p className="cline">
                  Weigh {coffee.toFixed(1)} g of coffee, then pour in {water} g of water (about {water} ml).
                </p>
              </div>
            )}
          </div>

          <BrewTimer key={key} method={key} />
        </div>
      </div>
    </section>
  );
}

/**
 * Keyed by method in the parent, so switching methods remounts this (fresh
 * state, old interval torn down by the unmount cleanup) instead of needing
 * to reset timer state from an effect.
 */
function BrewTimer({ method }: { method: MethodKey }) {
  const m = METHODS[method];
  const [left, setLeft] = useState(m.secs);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [ringing, setRinging] = useState(false);
  const endAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };

  const stopChime = () => {
    const a = audio.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setRinging(false);
  };

  // Unmount cleanup only (empty deps): stops the interval and the chime if
  // the page is left while the timer is running or ringing.
  useEffect(() => () => {
    stopTimer();
    stopChime();
  }, []);

  const startChime = () => {
    setRinging(true);
    const a = audio.current;
    if (a) {
      a.currentTime = 0;
      a.loop = true;
      a.play().catch(() => {});
    }
  };

  const tick = () => {
    const remaining = (endAt.current - Date.now()) / 1000;
    if (remaining <= 0) {
      stopTimer();
      setLeft(0);
      setDone(true);
      startChime();
    } else {
      setLeft(remaining);
    }
  };

  const toggleTimer = () => {
    if (running) {
      stopTimer();
      return;
    }
    stopChime();
    const startFrom = left <= 0 ? m.secs : left;
    setLeft(startFrom);
    setDone(false);
    endAt.current = Date.now() + startFrom * 1000;
    setRunning(true);
    timer.current = setInterval(tick, 200);
  };

  const resetTimer = () => {
    stopTimer();
    stopChime();
    setLeft(m.secs);
    setDone(false);
  };

  return (
    <div className="col fx">
      <div className="timer">
        <div>
          <p className="lab dim">Timer</p>
          <p className={`tnum${done ? " done" : ""}`}>{done ? "Done" : fmtTime(left, m.secs)}</p>
        </div>
        <div className="tbtns">
          <button className="btn btn-ghost" type="button" onClick={toggleTimer}>
            {running ? "Pause" : done ? "Start again" : left < m.secs ? "Resume" : "Start"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={resetTimer}>
            Reset
          </button>
        </div>
      </div>
      <p className="sr" role="status">
        {done ? "Time is up." : ""}
      </p>
      <ol className="steps">
        {m.steps.map((s) => (
          <li key={s}>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <p className="legal">Starting points. Adjust to taste.</p>
      <audio ref={audio} src="/sounds/brew-timer-chime.mp3" preload="auto" />
      {ringing && (
        <div className="brew-chime-banner" role="alert">
          <span>Brew timer done</span>
          <button className="btn" type="button" onClick={stopChime}>
            Stop
          </button>
        </div>
      )}
    </div>
  );
}
