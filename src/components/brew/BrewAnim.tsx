"use client";
import { useEffect, useRef } from "react";
import type { MethodKey } from "@/lib/catalogue";
import { LOGO_PATH } from "@/lib/logo-path";
import { createBrewScene } from "./brewScenes";
import { createPourScene } from "@/components/home/pourScene";

/**
 * The lifelike animation for one brew method. Pour over reuses the home-page
 * pour (kettle, dripper, glass mug) on a loop; the others have their own scene.
 * Remounted per method by the parent (key), so each starts fresh.
 */
export function BrewAnim({ method }: { method: MethodKey }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stop = () => {};
    let resize = () => {};
    try {
      if (method === "pour") {
        const scene = createPourScene(canvas, { logoPath: LOGO_PATH, logoColor: "#678BC7", timeline: "trim" });
        resize = () => scene.resize();
        if (reduce) {
          scene.jump(1);
        } else {
          // Loop: pour, hold the finished cup for a moment, fade, start again.
          scene.setProgress(1);
          let doneAt = 0;
          let fadeT: ReturnType<typeof setTimeout> | undefined;
          const timer = setInterval(() => {
            if (!scene.isDone()) return;
            if (!doneAt) doneAt = Date.now();
            if (Date.now() - doneAt > 3000 && canvas.style.opacity !== "0") {
              canvas.style.opacity = "0";
              fadeT = setTimeout(() => {
                scene.jump(0);
                scene.setProgress(1);
                doneAt = 0;
                canvas.style.opacity = "1";
              }, 400);
            }
          }, 200);
          stop = () => {
            clearInterval(timer);
            if (fadeT) clearTimeout(fadeT);
            scene.stop();
          };
        }
        if (reduce) stop = () => scene.stop();
      } else {
        const scene = createBrewScene(canvas, method, { logoPath: LOGO_PATH });
        stop = () => scene.stop();
        resize = () => scene.resize();
      }
    } catch {
      return;
    }
    let lastW = canvas.clientWidth;
    const onResize = () => {
      if (Math.abs(canvas.clientWidth - lastW) > 2) {
        lastW = canvas.clientWidth;
        resize();
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      stop();
    };
  }, [method]);

  return <canvas ref={ref} className={`brew-cv${method === "pour" ? " wide" : ""}`} aria-hidden="true" />;
}
