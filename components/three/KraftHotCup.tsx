"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { withBasePath } from "@/lib/utils";

interface KraftHotCupProps {
  scale?: number;
  cutaway?: boolean;
  showLid?: boolean;
}

export function KraftHotCup({ scale = 1, cutaway = false, showLid = false }: KraftHotCupProps) {
  const wrapTexture = useTexture(withBasePath("/brand/textures/kraft_cup_wrap.png"));

  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const innerMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lidGroupRef = useRef<THREE.Group>(null);
  const lidMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const revealRef = useRef(cutaway ? 0 : 1);

  useEffect(() => {
    wrapTexture.colorSpace = THREE.SRGBColorSpace;
    wrapTexture.anisotropy = 8;
    wrapTexture.needsUpdate = true;
  }, [wrapTexture]);

  const bodyGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.39, 0.28, 0.98, 64, 1, true);
    geo.rotateY(-Math.PI * 0.5);
    geo.translate(0, 0.49, 0);
    return geo;
  }, []);

  const innerGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.385, 0.275, 0.975, 64, 1, true);
    geo.translate(0, 0.488, 0);
    return geo;
  }, []);

  const rimGeo = useMemo(() => {
    const geo = new THREE.TorusGeometry(0.394, 0.016, 16, 64);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 0.98, 0);
    return geo;
  }, []);

  const lidGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 1.07),
      new THREE.Vector2(0.35, 1.07),
      new THREE.Vector2(0.365, 1.03),
      new THREE.Vector2(0.41, 1.02),
      new THREE.Vector2(0.415, 0.975),
      new THREE.Vector2(0.395, 0.975),
    ];
    return new THREE.LatheGeometry(pts, 64);
  }, []);

  useEffect(() => {
    return () => {
      bodyGeo.dispose();
      innerGeo.dispose();
      rimGeo.dispose();
      lidGeo.dispose();
    };
  }, [bodyGeo, innerGeo, rimGeo, lidGeo]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // When cutaway (pouring/mixing), reveal = 0 (inside view). When finished, reveal -> 1 (real outside kraft cup!)
    const targetReveal = cutaway ? 0.0 : 1.0;
    revealRef.current += (targetReveal - revealRef.current) * (1 - Math.exp(-8.5 * dt));
    const r = revealRef.current;

    if (bodyMatRef.current) {
      // During pour/mix: crystal-clear 0.16 cutaway so the inside liquid mixing is 100% visible!
      // When finished: 1.0 solid printed Kraft Paper outside cup!
      const op = THREE.MathUtils.lerp(0.16, 1.0, r);
      bodyMatRef.current.opacity = op;
      bodyMatRef.current.transparent = r < 0.98;
      bodyMatRef.current.depthWrite = r >= 0.85;
    }

    if (innerMatRef.current) {
      const innerOp = THREE.MathUtils.lerp(0.04, 1.0, r);
      innerMatRef.current.opacity = innerOp;
      innerMatRef.current.transparent = r < 0.98;
      innerMatRef.current.depthWrite = r >= 0.85;
    }

    if (lidGroupRef.current && lidMatRef.current) {
      const showLidAmt = showLid && !cutaway ? r : 0;
      lidGroupRef.current.visible = showLidAmt > 0.04;
      // Lid descends smoothly from above (+0.24 -> 0) and snaps onto the rim when opted-in
      lidGroupRef.current.position.y = (1 - showLidAmt) * 0.24;
      lidMatRef.current.opacity = showLidAmt;
      lidMatRef.current.transparent = showLidAmt < 0.98;
    }
  });

  return (
    <group scale={scale}>
      {/* Clean Crema Inner Paper Wall (renders at order 1 behind liquid & rim, visible above drink from top) */}
      <mesh geometry={innerGeo} receiveShadow renderOrder={1}>
        <meshStandardMaterial
          ref={innerMatRef}
          color="#F5EFE2"
          roughness={0.88}
          metalness={0.01}
          transparent
          opacity={1.0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Cup Floor */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow renderOrder={1}>
        <circleGeometry args={[0.274, 48]} />
        <meshStandardMaterial color="#F6F1EA" roughness={0.85} />
      </mesh>

      {/* Kraft Paper Cup Outer Shell */}
      <mesh geometry={bodyGeo} castShadow receiveShadow renderOrder={4}>
        <meshStandardMaterial
          ref={bodyMatRef}
          map={wrapTexture}
          roughness={0.82}
          metalness={0.02}
          transparent
          opacity={1.0}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Rolled Top Rim */}
      <mesh geometry={rimGeo} castShadow>
        <meshStandardMaterial color="#DFCBB2" roughness={0.7} />
      </mesh>

      {/* Matte White Sip Lid (descends and snaps on when pouring finishes) */}
      <group ref={lidGroupRef}>
        <mesh geometry={lidGeo} castShadow receiveShadow renderOrder={6}>
          <meshStandardMaterial
            ref={lidMatRef}
            color="#FAF7F2"
            roughness={0.38}
            metalness={0.03}
          />
        </mesh>
      </group>
    </group>
  );
}
