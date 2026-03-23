"use client";

import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef, useEffect, useState } from "react";
import { shaderMaterial } from "@react-three/drei";

/*
 * Custom GLSL shader: flowing liquid gradient with noise-based distortion.
 * Inspired by Stripe's mesh gradient and liquid-glass effects.
 */
const GradientMeshMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uResolution: new THREE.Vector2(1, 1),
  },
  /* vertex */
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  /* fragment */
  `
    precision highp float;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // Simplex-like noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                         -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                                   + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                               dot(x12.zw, x12.zw)), 0.0);
      m = m * m;
      m = m * m;
      vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x_) - 0.5;
      vec3 ox = floor(x_ + 0.5);
      vec3 a0 = x_ - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 1.0;
      for (int i = 0; i < 5; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / uResolution.y;
      vec2 p = vec2(uv.x * aspect, uv.y);
      float t = uTime * 0.15;

      // Mouse influence: subtle pull
      vec2 mouseInfluence = (uMouse - 0.5) * 0.3;

      // Warped coordinates through noise
      float warp1 = fbm(p * 1.2 + vec2(t * 0.7, t * 0.5) + mouseInfluence);
      float warp2 = fbm(p * 0.8 + vec2(-t * 0.4, t * 0.6) - mouseInfluence * 0.5);
      vec2 warped = p + vec2(warp1, warp2) * 0.4;

      // Color centers that drift over time
      vec2 c1 = vec2(0.3 + sin(t * 1.1) * 0.3, 0.4 + cos(t * 0.9) * 0.3);
      vec2 c2 = vec2(0.7 + cos(t * 0.8) * 0.3, 0.6 + sin(t * 1.2) * 0.3);
      vec2 c3 = vec2(0.5 + sin(t * 0.6) * 0.4, 0.3 + cos(t * 1.4) * 0.3);
      vec2 c4 = vec2(0.4 + cos(t * 1.0) * 0.2, 0.7 + sin(t * 0.7) * 0.2);

      float d1 = length(warped - c1 * vec2(aspect, 1.0));
      float d2 = length(warped - c2 * vec2(aspect, 1.0));
      float d3 = length(warped - c3 * vec2(aspect, 1.0));
      float d4 = length(warped - c4 * vec2(aspect, 1.0));

      vec3 col1 = vec3(0.06, 0.30, 0.70);   // Vivid deep blue
      vec3 col2 = vec3(0.04, 0.60, 0.72);  // Bright electric cyan
      vec3 col3 = vec3(0.40, 0.18, 0.65);  // Vibrant purple
      vec3 col4 = vec3(0.02, 0.08, 0.18);  // Dark depth anchor

      // Soft blending with noise-modulated weights
      float w1 = 1.0 / (d1 * d1 + 0.15);
      float w2 = 1.0 / (d2 * d2 + 0.15);
      float w3 = 1.0 / (d3 * d3 + 0.15);
      float w4 = 1.0 / (d4 * d4 + 0.15);
      float wTotal = w1 + w2 + w3 + w4;

      vec3 color = (col1 * w1 + col2 * w2 + col3 * w3 + col4 * w4) / wTotal;

      // Secondary noise layer for additional texture
      float detail = fbm(warped * 3.0 + t * 0.5) * 0.08;
      color += detail;

      // Subtle vignette: darken outer edges, keep center vivid
      float vignette = 1.0 - smoothstep(0.5, 1.6, length(uv - 0.5) * 1.4);
      color *= mix(0.3, 1.0, vignette);

      // Film grain for premium feel
      float grain = (fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.015;
      color += grain;

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

extend({ GradientMeshMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    gradientMeshMaterial: THREE.ShaderMaterial & {
      uTime: number;
      uMouse: THREE.Vector2;
      uResolution: THREE.Vector2;
    };
  }
}

function GradientBackground() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5));
  const targetMouse = useRef(new THREE.Vector2(0.5, 0.5));
  const { size } = useThree();

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      targetMouse.current.set(
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight
      );
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    const mat = materialRef.current as THREE.ShaderMaterial & {
      uTime: number;
      uMouse: THREE.Vector2;
      uResolution: THREE.Vector2;
    };
    mat.uTime = clock.getElapsedTime();

    mouseRef.current.lerp(targetMouse.current, 0.03);
    mat.uMouse = mouseRef.current;
    mat.uResolution = new THREE.Vector2(size.width, size.height);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      {/* @ts-expect-error custom shader material */}
      <gradientMeshMaterial ref={materialRef} depthWrite={false} />
    </mesh>
  );
}

const PARTICLE_COUNT = 400;

function FlowingParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const { positions, velocities, sizes } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = new Float32Array(PARTICLE_COUNT * 3);
    const sz = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;

      vel[i * 3] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;

      sz[i] = 0.01 + Math.random() * 0.03;
    }
    return { positions: pos, velocities: vel, sizes: sz };
  }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute("position");
    const t = clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;

      // Flow field: sine-based drift + time
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);

      const flowX = Math.sin(y * 0.5 + t * 0.3) * 0.003 + velocities[ix];
      const flowY = Math.cos(x * 0.5 + t * 0.2) * 0.002 + velocities[ix + 1];

      let nx = x + flowX;
      let ny = y + flowY;
      let nz = posAttr.getZ(i) + velocities[ix + 2];

      // Wrap around boundaries
      if (nx > 5) nx = -5;
      if (nx < -5) nx = 5;
      if (ny > 3) ny = -3;
      if (ny < -3) ny = 3;
      if (nz > 2) nz = -2;
      if (nz < -2) nz = 2;

      posAttr.setXYZ(i, nx, ny, nz);
    }
    posAttr.needsUpdate = true;

    // Subtle group rotation from mouse
    pointsRef.current.rotation.y +=
      (mouseRef.current.x * 0.05 - pointsRef.current.rotation.y) * 0.02;
    pointsRef.current.rotation.x +=
      (mouseRef.current.y * 0.03 - pointsRef.current.rotation.x) * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8ecfff"
        size={0.028}
        sizeAttenuation
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function HeroCanvas() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "high-performance", alpha: true }}
        style={{ background: "#050505" }}
      >
        <GradientBackground />
        <FlowingParticles />
      </Canvas>
    </div>
  );
}
