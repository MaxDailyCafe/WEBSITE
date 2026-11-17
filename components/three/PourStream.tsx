"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PourStreamProps {
  active: boolean;
  color: string;
  thickness?: number;
  surfaceY: number;
  spoutY?: number;
}

const streamVert = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // d = 0 at top spout, d = 1 at bottom impact
    float d = 1.0 - uv.y;
    // Gravity acceleration narrows the stream as it falls faster from up to down
    float gravityNarrow = mix(1.28, 0.56, sqrt(clamp(d, 0.0, 1.0)));
    // Downward peristaltic liquid beads traveling from top to bottom
    float bead = sin(d * 26.0 - uTime * 34.0) * 0.12 * (0.3 + d * 0.7);
    pos.xz *= (gravityNarrow + bead);

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vPosW = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const streamFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uHead;
  uniform float uTail;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  void main() {
    float d = 1.0 - vUv.y;
    if (d > uHead || d < uTail) discard;

    vec3 viewDir = normalize(cameraPosition - vPosW);
    float fresnel = pow(1.0 - max(abs(dot(normalize(vNormalW), viewDir)), 0.0), 2.0);
    float downwardFlow = sin(d * 42.0 - uTime * 38.0) * 0.5 + 0.5;

    vec3 col = mix(uColor * 0.9, uColor * 1.3, downwardFlow * 0.42);
    col += vec3(0.42, 0.36, 0.28) * fresnel;

    // Rounded liquid droplet leading head & pinched trailing tail
    float headMask = smoothstep(uHead, max(0.0, uHead - 0.09), d);
    float tailMask = smoothstep(uTail, min(1.0, uTail + 0.09), d);

    gl_FragColor = vec4(col, 0.98 * headMask * tailMask);
  }
`;

export function PourStream({
  active,
  color,
  thickness = 0.046,
  surfaceY,
  spoutY = 1.62,
}: PourStreamProps) {
  const streamMeshRef = useRef<THREE.Mesh>(null);
  const spoutRef = useRef<THREE.Group>(null);
  const fallingDropsRef = useRef<THREE.Group>(null);
  const splashGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const stateRef = useRef({
    fallTime: 0,
    tailTime: 0,
    head: 0,
    tail: 0,
    spoutLift: 1,
    splashAmt: 0,
    wasActive: false,
  });

  const streamGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(thickness, thickness, 1, 32, 40, false);
    geo.translate(0, 0.5, 0);
    return geo;
  }, [thickness]);

  useEffect(() => {
    return () => streamGeo.dispose();
  }, [streamGeo]);

  const streamMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(color) },
          uHead: { value: 0 },
          uTail: { value: 0 },
        },
        vertexShader: streamVert,
        fragmentShader: streamFrag,
        transparent: true,
        depthWrite: false,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    return () => streamMaterial.dispose();
  }, [streamMaterial]);

  useEffect(() => {
    (streamMaterial.uniforms.uColor.value as THREE.Color).set(color);
  }, [color, streamMaterial]);

  // Initialize hidden once on mount (never via JSX `visible={false}` which re-hides on 60fps surfaceY renders)
  useLayoutEffect(() => {
    if (spoutRef.current) spoutRef.current.visible = false;
    if (streamMeshRef.current) streamMeshRef.current.visible = false;
    if (fallingDropsRef.current) fallingDropsRef.current.visible = false;
    if (ringRef.current) ringRef.current.visible = false;
    if (splashGroupRef.current) splashGroupRef.current.visible = false;
  }, []);

  // 14 gravity-accelerating teardrop globules dropping from top spout into the cup
  const fallingDrops = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      phase: i / 14,
      offsetX: Math.cos(i * 2.1) * 0.018,
      offsetZ: Math.sin(i * 2.1) * 0.018,
      radius: 0.022 + (i % 3) * 0.006,
    }));
  }, []);

  // 12 splash droplets bursting upward where stream hits surfaceY
  const splashDrops = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      angle: (i / 12) * Math.PI * 2,
      speed: 1.8 + (i % 3) * 0.45,
      radius: 0.07 + (i % 4) * 0.032,
      height: 0.09 + (i % 3) * 0.045,
      phase: i * 0.52,
    }));
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const u = streamMaterial.uniforms;
    u.uTime.value += dt;
    const s = stateRef.current;

    if (active && !s.wasActive) {
      s.fallTime = 0;
      s.tailTime = 0;
      s.head = 0.01;
      s.tail = 0.0;
      s.wasActive = true;
    } else if (!active && s.wasActive) {
      s.tailTime = 0;
      s.wasActive = false;
    }

    if (active) {
      // Gravity acceleration: d = 0.5 * g * t^2 from top spout (0) down to surface (1)
      s.fallTime += dt;
      s.head = Math.min(1.0, 0.04 + 14.5 * s.fallTime * s.fallTime);
      s.tail = 0.0;
      s.spoutLift += (0 - s.spoutLift) * (1 - Math.exp(-12 * dt));
    } else {
      // Pinch off at top spout and fall down into cup with gravity acceleration
      s.tailTime += dt;
      s.tail = Math.min(1.0, 15.0 * s.tailTime * s.tailTime);
      s.spoutLift += (1 - s.spoutLift) * (1 - Math.exp(-8 * dt));
    }

    u.uHead.value = s.head;
    u.uTail.value = s.tail;

    const hitting = s.head >= 0.92 && s.tail < 0.85;
    s.splashAmt += ((hitting ? 1 : 0) - s.splashAmt) * (1 - Math.exp(-14 * dt));

    const clampedSurface = Math.max(0.055, Math.min(spoutY - 0.14, surfaceY));
    const colHeight = Math.max(0.1, spoutY - clampedSurface);

    if (streamMeshRef.current) {
      streamMeshRef.current.position.set(0, clampedSurface, 0);
      streamMeshRef.current.scale.set(1, colHeight, 1);
      streamMeshRef.current.visible = s.head - s.tail > 0.015;
    }

    if (spoutRef.current) {
      spoutRef.current.position.set(0, spoutY + s.spoutLift * 0.35, 0);
      spoutRef.current.visible = s.spoutLift < 0.96;
    }

    // Animate individual gravity-falling teardrop globules from spoutY down to clampedSurface
    if (fallingDropsRef.current) {
      const streamActive = s.head - s.tail > 0.05;
      fallingDropsRef.current.visible = streamActive;
      fallingDropsRef.current.children.forEach((child, idx) => {
        const fd = fallingDrops[idx];
        if (!fd) return;
        const cycle = (u.uTime.value * 2.4 + fd.phase) % 1;
        // Quadratic gravity fall: 0 at spoutY -> 1 at clampedSurface
        const dFall = cycle * cycle;
        const visibleInWindow = dFall <= s.head && dFall >= s.tail;
        child.visible = visibleInWindow;
        const yPos = THREE.MathUtils.lerp(spoutY, clampedSurface, dFall);
        child.position.set(fd.offsetX, yPos, fd.offsetZ);
        // Stretch vertically as velocity increases downward
        const stretch = 1.0 + cycle * 0.85;
        child.scale.set(fd.radius, fd.radius * stretch, fd.radius);
      });
    }

    if (ringRef.current) {
      ringRef.current.position.set(0, clampedSurface + 0.008, 0);
      const pulse = (u.uTime.value * 5.0) % 1;
      ringRef.current.scale.setScalar(0.4 + pulse * 1.5);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        (1 - pulse) * 0.8 * s.splashAmt;
      ringRef.current.visible = s.splashAmt > 0.03;
    }

    if (splashGroupRef.current) {
      splashGroupRef.current.position.set(0, clampedSurface, 0);
      splashGroupRef.current.visible = s.splashAmt > 0.04;
      splashGroupRef.current.children.forEach((child, idx) => {
        const d = splashDrops[idx];
        if (!d) return;
        const cycle = (u.uTime.value * d.speed + d.phase) % 1;
        const r = cycle * d.radius * s.splashAmt;
        const y = Math.sin(cycle * Math.PI) * d.height * s.splashAmt;
        child.position.set(Math.cos(d.angle) * r, y, Math.sin(d.angle) * r);
        child.scale.setScalar((1 - cycle * 0.5) * s.splashAmt);
      });
    }
  });

  return (
    <group>
      {/* Overhead Verde Abeto & Rojo Tomate Barista Spout */}
      <group ref={spoutRef}>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.1, 0.072, 0.2, 32]} />
          <meshStandardMaterial color="#0D2419" roughness={0.25} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.078, 0.056, 0.048, 32]} />
          <meshStandardMaterial color="#D9381E" roughness={0.22} metalness={0.65} />
        </mesh>
      </group>

      {/* Continuous Gravity-Accelerating Vertical Liquid Stream */}
      <mesh
        ref={streamMeshRef}
        geometry={streamGeo}
        material={streamMaterial}
        renderOrder={6}
      />

      {/* Falling Teardrop Liquid Globules Dropping from Up to Down */}
      <group ref={fallingDropsRef}>
        {fallingDrops.map((_, idx) => (
          <mesh key={idx} renderOrder={6}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshPhysicalMaterial
              color={color}
              roughness={0.1}
              clearcoat={1.0}
            />
          </mesh>
        ))}
      </group>

      {/* Splash Crown Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={6}>
        <ringGeometry args={[0.055, 0.12, 32]} />
        <meshBasicMaterial color="#FAF6EE" transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Bouncing Impact Splash Droplets */}
      <group ref={splashGroupRef}>
        {splashDrops.map((_, idx) => (
          <mesh key={idx} renderOrder={6}>
            <sphereGeometry args={[0.021, 10, 10]} />
            <meshStandardMaterial color={color} roughness={0.14} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
