"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";

function ParticleSphere() {
	const ref = useRef<THREE.Points>(null);
	const positions = useMemo(() => {
		const pts: number[] = [];
		const count = 2000;
		for (let i = 0; i < count; i++) {
			const theta = Math.acos(THREE.MathUtils.randFloatSpread(2));
			const phi = Math.PI * 2 * Math.random();
			const r = 1.2 + Math.random() * 0.2;
			pts.push(
				r * Math.sin(theta) * Math.cos(phi),
				r * Math.sin(theta) * Math.sin(phi),
				r * Math.cos(theta)
			);
		}
		return new Float32Array(pts);
	}, []);

	useFrame((_s, delta) => {
		if (ref.current) {
			ref.current.rotation.y += delta * 0.06;
			ref.current.rotation.x += delta * 0.02;
		}
	});
	return (
		<Points ref={ref} positions={positions} stride={3} frustumCulled>
			<PointMaterial color="#1e90ff" size={0.02} sizeAttenuation depthWrite={false} transparent opacity={0.85} />
		</Points>
	);
}

export default function HeroCanvas() {
	return (
		<div className="absolute right-0 top-0 -z-10 h-[520px] w-full md:w-[55%] opacity-80 pointer-events-none">
			<Canvas
				camera={{ position: [0, 0, 3] }}
				dpr={[1, 2]}
				gl={{ antialias: true, powerPreference: "high-performance" }}
			>
				<ambientLight intensity={0.2} />
				<directionalLight position={[3, 3, 3]} intensity={1.2} color={"#1e90ff"} />
				<ParticleSphere />
				<OrbitControls enablePan={false} enableZoom={false} autoRotate={false} />
			</Canvas>
		</div>
	);
}
