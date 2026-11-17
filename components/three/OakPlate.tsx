"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { withBasePath } from "@/lib/utils";

interface OakPlateProps {
  glazeColor?: string;
  crunchColor?: string;
  merged?: boolean;
}

function makeRoundedRectShape(w: number, h: number, r: number) {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

export function OakPlate({
  glazeColor = "#2D170E",
  crunchColor = "#B86E34",
  merged = false,
}: OakPlateProps) {
  const [oakTex, engravedLogo] = useTexture([
    withBasePath("/brand/textures/light_oak_grain.png"),
    withBasePath("/brand/textures/oak_engraved_logo.png"),
  ]);

  useEffect(() => {
    oakTex.colorSpace = THREE.SRGBColorSpace;
    oakTex.wrapS = THREE.RepeatWrapping;
    oakTex.wrapT = THREE.RepeatWrapping;
    oakTex.repeat.set(1.2, 1.2);
    engravedLogo.colorSpace = THREE.SRGBColorSpace;
  }, [oakTex, engravedLogo]);

  const plateBaseGeo = useMemo(() => {
    const outer = makeRoundedRectShape(1.42, 0.94, 0.16);
    const geo = new THREE.ExtrudeGeometry(outer, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.018,
      bevelSegments: 4,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const rimGeo = useMemo(() => {
    const outer = makeRoundedRectShape(1.42, 0.94, 0.16);
    const inner = makeRoundedRectShape(1.18, 0.7, 0.11);
    outer.holes.push(inner);
    const geo = new THREE.ExtrudeGeometry(outer, {
      depth: 0.032,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 3,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0.048, 0);
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      plateBaseGeo.dispose();
      rimGeo.dispose();
    };
  }, [plateBaseGeo, rimGeo]);

  const cakeRef = useRef<THREE.Mesh>(null);
  const glazeRef = useRef<THREE.Mesh>(null);
  const crunchRef = useRef<THREE.Mesh>(null);
  const shimmerRef = useRef<THREE.Mesh>(null);
  const mergeProgressRef = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = merged ? 1 : 0;
    mergeProgressRef.current += (target - mergeProgressRef.current) * (1 - Math.exp(-5.2 * dt));
    const m = mergeProgressRef.current;

    if (cakeRef.current) {
      cakeRef.current.position.y = THREE.MathUtils.lerp(0.42, 0.25, m);
    }
    if (glazeRef.current) {
      glazeRef.current.position.y = THREE.MathUtils.lerp(0.7, 0.39, m);
    }
    if (crunchRef.current) {
      crunchRef.current.position.y = THREE.MathUtils.lerp(0.92, 0.44, m);
    }
    if (shimmerRef.current) {
      const pulse = Math.sin(m * Math.PI);
      shimmerRef.current.visible = pulse > 0.04;
      shimmerRef.current.scale.setScalar(0.6 + m * 0.78);
      (shimmerRef.current.material as THREE.MeshBasicMaterial).opacity = pulse * 0.65;
    }
  });

  return (
    <group>
      <mesh geometry={plateBaseGeo} castShadow receiveShadow>
        <meshStandardMaterial map={oakTex} color="#F3DFC1" roughness={0.55} />
      </mesh>
      <mesh geometry={rimGeo} castShadow receiveShadow>
        <meshStandardMaterial map={oakTex} color="#ECD5B2" roughness={0.5} />
      </mesh>

      {/* Laser-Engraved MAX DAILY Logo on Front Rim */}
      <mesh position={[0.38, 0.092, 0.405]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <planeGeometry args={[0.22, 0.115]} />
        <meshBasicMaterial map={engravedLogo} transparent opacity={0.9} depthWrite={false} />
      </mesh>

      {/* Layered Dessert Stack */}
      <group position={[0, 0, -0.02]}>
        <mesh position={[0, 0.11, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.35, 0.07, 48]} />
          <meshStandardMaterial color="#B57A45" roughness={0.85} />
        </mesh>
        <mesh ref={cakeRef} position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.31, 0.335, 0.24, 48]} />
          <meshStandardMaterial color="#F5E5C9" roughness={0.45} />
        </mesh>
        <mesh ref={glazeRef} position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.318, 0.322, 0.055, 48]} />
          <meshStandardMaterial color={glazeColor} roughness={0.18} metalness={0.08} />
        </mesh>
        <mesh ref={crunchRef} position={[0, 0.92, 0]} castShadow>
          <torusGeometry args={[0.16, 0.032, 12, 32]} />
          <meshStandardMaterial color={crunchColor} roughness={0.8} />
        </mesh>
        <mesh ref={shimmerRef} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.34, 0.46, 48]} />
          <meshBasicMaterial color="#D9AE7B" transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
