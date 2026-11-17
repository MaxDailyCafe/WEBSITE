"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { withBasePath } from "@/lib/utils";

interface ClearIcedCupProps {
  scale?: number;
  cutaway?: boolean;
  showLid?: boolean;
}

export function ClearIcedCup({
  scale = 1,
  cutaway = false,
  showLid = true,
}: ClearIcedCupProps) {
  const [frontDecal, backDecal, condensationTex] = useTexture([
    withBasePath("/brand/textures/clear_front_logo.png"),
    withBasePath("/brand/textures/clear_back_slogan.png"),
    withBasePath("/brand/textures/cup_condensation.png"),
  ]);

  const shellMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const condMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const frontMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const backMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const lidGroupRef = useRef<THREE.Group>(null);
  const revealRef = useRef(cutaway ? 0 : 1);

  useEffect(() => {
    frontDecal.colorSpace = THREE.SRGBColorSpace;
    backDecal.colorSpace = THREE.SRGBColorSpace;
    condensationTex.colorSpace = THREE.SRGBColorSpace;
    frontDecal.anisotropy = 8;
    backDecal.anisotropy = 8;
    condensationTex.anisotropy = 8;
    condensationTex.wrapS = THREE.RepeatWrapping;
    condensationTex.needsUpdate = true;
  }, [frontDecal, backDecal, condensationTex]);

  const cupBodyGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.242, 0.0),
      new THREE.Vector2(0.252, 0.055),
      new THREE.Vector2(0.246, 0.068),
      new THREE.Vector2(0.262, 0.082),
      new THREE.Vector2(0.366, 0.94),
      new THREE.Vector2(0.376, 0.96),
      new THREE.Vector2(0.372, 1.04),
      new THREE.Vector2(0.384, 1.07),
      new THREE.Vector2(0.402, 1.085),
    ];
    return new THREE.LatheGeometry(pts, 72);
  }, []);

  const condensationGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.378, 0.256, 1.02, 72, 1, true);
    geo.translate(0, 0.54, 0);
    return geo;
  }, []);

  const baseRingGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.254, 0.244, 0.052, 64);
    geo.translate(0, 0.026, 0);
    return geo;
  }, []);

  const frontArcGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.344, 0.304, 0.38, 48, 1, true, -0.56, 1.12);
    geo.translate(0, 0.56, 0);
    return geo;
  }, []);

  const backArcGeo = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.346, 0.302, 0.42, 48, 1, true, Math.PI - 0.65, 1.3);
    geo.translate(0, 0.56, 0);
    return geo;
  }, []);

  const lidGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.412, 1.062),
      new THREE.Vector2(0.406, 1.115),
      new THREE.Vector2(0.386, 1.122),
      new THREE.Vector2(0.372, 1.102),
      new THREE.Vector2(0.335, 1.102),
      new THREE.Vector2(0.325, 1.125),
      new THREE.Vector2(0.055, 1.125),
      new THREE.Vector2(0.042, 1.098),
      new THREE.Vector2(0.0, 1.098),
    ];
    return new THREE.LatheGeometry(pts, 72);
  }, []);

  const lidCrimpPositions = useMemo(() => {
    return Array.from({ length: 56 }, (_, i) => {
      const a = (i / 56) * Math.PI * 2;
      return {
        x: Math.cos(a) * 0.406,
        z: Math.sin(a) * 0.406,
        rotY: -a,
      };
    });
  }, []);

  useEffect(() => {
    return () => {
      cupBodyGeo.dispose();
      condensationGeo.dispose();
      baseRingGeo.dispose();
      frontArcGeo.dispose();
      backArcGeo.dispose();
      lidGeo.dispose();
    };
  }, [cupBodyGeo, condensationGeo, baseRingGeo, frontArcGeo, backArcGeo, lidGeo]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // While pouring/mixing (`cutaway === true`), fade exterior condensation & decals back so inside mixing is 100% unobstructed!
    // When finished (`cutaway === false`), smoothly materialize the full real exterior cup, condensation droplets, logos, and snap lid on!
    const targetReveal = cutaway ? 0.0 : 1.0;
    revealRef.current += (targetReveal - revealRef.current) * (1 - Math.exp(-8.0 * dt));
    const r = revealRef.current;

    if (shellMatRef.current) {
      shellMatRef.current.opacity = THREE.MathUtils.lerp(0.08, 0.2, r);
    }
    if (condMatRef.current) {
      condMatRef.current.opacity = THREE.MathUtils.lerp(0.02, 0.18, r);
    }
    if (frontMatRef.current) {
      frontMatRef.current.opacity = THREE.MathUtils.lerp(0.18, 0.98, r);
    }
    if (backMatRef.current) {
      backMatRef.current.opacity = THREE.MathUtils.lerp(0.18, 0.96, r);
    }
    if (lidGroupRef.current) {
      const lidVis = showLid && !cutaway ? r : 0;
      lidGroupRef.current.visible = lidVis > 0.05;
      // Lid lowers smoothly from above (+0.24 -> 0) and snaps onto the rim when pouring finishes!
      lidGroupRef.current.position.y = (1 - lidVis) * 0.24;
    }
  });

  return (
    <group scale={scale}>
      {/* Molded Thick Clear Base Step */}
      <mesh geometry={baseRingGeo} renderOrder={1}>
        <meshPhysicalMaterial
          color="#1E120A"
          transparent
          opacity={0.55}
          roughness={0.12}
          metalness={0.15}
          clearcoat={1.0}
          depthWrite={false}
        />
      </mesh>

      {/* Crystal Clear PET Shell */}
      <mesh geometry={cupBodyGeo} renderOrder={4}>
        <meshPhysicalMaterial
          ref={shellMatRef}
          color="#FFFDF9"
          transparent
          opacity={0.2}
          roughness={0.04}
          metalness={0.12}
          reflectivity={1.0}
          clearcoat={1.0}
          clearcoatRoughness={0.03}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cold Condensation Water Droplets + Studio Rim Specular Streaks */}
      <mesh geometry={condensationGeo} renderOrder={5}>
        <meshBasicMaterial
          ref={condMatRef}
          map={condensationTex}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* Crisp White Vertical MAX DAILY Print on Front (+Z) */}
      <mesh geometry={frontArcGeo} renderOrder={6}>
        <meshBasicMaterial
          ref={frontMatRef}
          map={frontDecal}
          transparent
          opacity={0.98}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Crisp White "A DAILY DOSE OF POSITIVITY" + Hands Line Art on Back (-Z) */}
      <mesh geometry={backArcGeo} renderOrder={6}>
        <meshBasicMaterial
          ref={backMatRef}
          map={backDecal}
          transparent
          opacity={0.96}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Realistic Ribbed Thermoformed Clear Sip Lid (snaps on when finished) */}
      <group ref={lidGroupRef}>
        <mesh geometry={lidGeo} renderOrder={7}>
          <meshPhysicalMaterial
            color="#FFFFFF"
            transparent
            opacity={0.34}
            roughness={0.08}
            metalness={0.1}
            clearcoat={1.0}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 1.116, 0]} rotation={[Math.PI / 2, 0, 0]} renderOrder={7}>
          <torusGeometry args={[0.395, 0.008, 12, 72]} />
          <meshBasicMaterial color="#FFFDF8" transparent opacity={0.62} depthWrite={false} />
        </mesh>
        {lidCrimpPositions.map((c, idx) => (
          <mesh
            key={idx}
            position={[c.x, 1.09, c.z]}
            rotation={[0, c.rotY, 0]}
            renderOrder={7}
          >
            <boxGeometry args={[0.005, 0.044, 0.008]} />
            <meshBasicMaterial
              color="#FFFDF8"
              transparent
              opacity={idx % 2 === 0 ? 0.52 : 0.28}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
