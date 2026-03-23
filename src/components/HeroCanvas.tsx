"use client";

import { useEffect, useRef, useState } from "react";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let w = window.innerWidth;
    let h = window.innerHeight;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const handleResize = () => resize();
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouse);

    const COUNT = 100;
    interface P {
      x: number; y: number; vx: number; vy: number;
      size: number; baseAlpha: number; hue: number;
      life: number; maxLife: number;
    }

    function spawn(): P {
      return {
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: 1.2 + Math.random() * 2,
        baseAlpha: 0.15 + Math.random() * 0.35,
        hue: 190 + Math.random() * 50,
        life: Math.random() * 500,
        maxLife: 400 + Math.random() * 400,
      };
    }

    const pts: P[] = Array.from({ length: COUNT }, spawn);

    let t = 0;
    function draw() {
      t += 0.004;
      ctx!.clearRect(0, 0, w, h);

      for (const p of pts) {
        const fx = Math.sin(p.y * 0.002 + t * 1.8) * 0.25;
        const fy = Math.cos(p.x * 0.002 + t * 1.4) * 0.2;
        p.x += p.vx + fx;
        p.y += p.vy + fy;
        p.life++;
        if (p.x < -30) p.x += w + 60;
        if (p.x > w + 30) p.x -= w + 60;
        if (p.y < -30) p.y += h + 60;
        if (p.y > h + 30) p.y -= h + 60;
        if (p.life > p.maxLife) Object.assign(p, spawn());

        const fade = p.life < 50 ? p.life / 50
          : p.life > p.maxLife - 50 ? (p.maxLife - p.life) / 50 : 1;

        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const glow = dist < 180 ? (1 - dist / 180) * 0.5 : 0;
        const alpha = Math.min(1, p.baseAlpha * fade + glow);

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 85%, 72%, ${alpha})`;
        ctx!.fill();

        if (p.size > 1.5) {
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx!.fillStyle = `hsla(${p.hue}, 80%, 60%, ${alpha * 0.06})`;
          ctx!.fill();
        }
      }

      ctx!.lineWidth = 0.4;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = dx * dx + dy * dy;
          if (d < 14400) {
            const a = (1 - Math.sqrt(d) / 120) * 0.1;
            ctx!.beginPath();
            ctx!.moveTo(pts[i].x, pts[i].y);
            ctx!.lineTo(pts[j].x, pts[j].y);
            ctx!.strokeStyle = `hsla(205, 70%, 65%, ${a})`;
            ctx!.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ pointerEvents: "none" }}
    />
  );
}

export default function HeroCanvas() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Base gradient layer — always visible, paints over body bg */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 40%, rgba(30,144,255,0.18) 0%, transparent 70%), " +
            "radial-gradient(ellipse 70% 50% at 75% 30%, rgba(6,182,212,0.14) 0%, transparent 70%), " +
            "radial-gradient(ellipse 60% 50% at 50% 80%, rgba(139,92,246,0.10) 0%, transparent 70%), " +
            "linear-gradient(180deg, #050510 0%, #030308 100%)",
        }}
      />

      {/* Animated gradient orbs */}
      <div className="absolute inset-0">
        <div
          className="absolute rounded-full"
          style={{
            width: 700, height: 700,
            background: "radial-gradient(circle, rgba(30,144,255,0.35) 0%, rgba(30,144,255,0.05) 50%, transparent 70%)",
            top: "5%", left: "10%",
            animation: "drift1 18s ease-in-out infinite",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 600, height: 600,
            background: "radial-gradient(circle, rgba(6,182,212,0.30) 0%, rgba(6,182,212,0.05) 50%, transparent 70%)",
            top: "25%", right: "5%",
            animation: "drift2 22s ease-in-out infinite",
            filter: "blur(50px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 650, height: 650,
            background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(139,92,246,0.04) 50%, transparent 70%)",
            bottom: "0%", left: "30%",
            animation: "drift3 20s ease-in-out infinite",
            filter: "blur(70px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500,
            background: "radial-gradient(circle, rgba(37,99,235,0.28) 0%, rgba(37,99,235,0.05) 50%, transparent 70%)",
            top: "45%", left: "55%",
            animation: "drift4 25s ease-in-out infinite",
            filter: "blur(55px)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 450, height: 450,
            background: "radial-gradient(circle, rgba(8,145,178,0.22) 0%, transparent 60%)",
            top: "0%", right: "25%",
            animation: "drift5 16s ease-in-out infinite",
            filter: "blur(45px)",
          }}
        />
      </div>

      {/* Canvas particle overlay */}
      {mounted && <ParticleCanvas />}

      {/* Noise grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Subtle top-edge glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(30,144,255,0.3), rgba(6,182,212,0.3), transparent)",
        }}
      />
    </div>
  );
}
