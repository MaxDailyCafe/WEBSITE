"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { VisualSpec } from "@/lib/rules/types";

interface DropParticlesProps {
  iceCount: number;
  garnishKind?: VisualSpec["particleKind"];
  garnishCount: number;
  liquidTopY: number;
  liquidColor?: string;
  dropSeed: number;
  swirlImpulse?: number;
}

const realIceVert = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosW = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const realIceFrag = /* glsl */ `
  uniform vec3 uLiquidColor;
  uniform float uLiquidTopY;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vLocalPos;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPosW);
    vec3 n = normalize(vNormalW);

    // Cup local coordinates (cup group is at y = -0.47)
    float cupY = vPosW.y + 0.47;
    float hNorm = clamp((cupY - 0.05) / 1.02, 0.0, 1.0);
    float cupInnerR = mix(0.252, 0.368, hNorm) * 0.945;
    float radialR = length(vPosW.xz);

    // Keep strictly inside the cup silhouette
    if (radialR > cupInnerR - 0.003) {
      discard;
    }

    // Beer-Lambert liquid depth attenuation:
    // Cubes near the clear cup wall or top crema surface are bright & glossy; deeper inside they blend into the drink
    float distFromWall = max(0.0, cupInnerR - radialR);
    float distFromTop = max(0.0, uLiquidTopY - cupY);
    float effectiveDepth = min(distFromWall, distFromTop * 0.8);
    float beerLambert = exp(-effectiveDepth * 13.0);

    float cameraSideMask = smoothstep(-0.05, 0.18, dot(normalize(vec3(vPosW.x, 0.0, vPosW.z)), normalize(vec3(cameraPosition.x, 0.0, cameraPosition.z))));
    float topSurfaceBoost = smoothstep(uLiquidTopY - 0.075, uLiquidTopY + 0.015, cupY);
    float visibility = clamp(max(beerLambert * cameraSideMask, topSurfaceBoost * 0.95), 0.0, 1.0);

    if (visibility < 0.03) {
      discard;
    }

    // Wet glass Fresnel rim highlight + overhead key specular
    float ndotv = max(dot(n, viewDir), 0.0);
    float fresnel = pow(1.0 - ndotv, 2.4);
    vec3 lightDir = normalize(vec3(0.45, 0.85, 0.55));
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(n, halfVec), 0.0), 48.0);

    // Internal frost core + drink color refraction
    float submergeMask = smoothstep(-0.04, 0.05, vLocalPos.y);
    float submergedInCup = 1.0 - smoothstep(uLiquidTopY - 0.025, uLiquidTopY + 0.025, cupY);
    vec3 dryIceCol = vec3(0.93, 0.96, 0.99);
    vec3 wetIceCol = mix(uLiquidColor * 1.16, vec3(0.95, 0.96, 0.98), 0.36 + submergeMask * 0.3);
    vec3 coreColor = mix(dryIceCol, wetIceCol, submergedInCup);

    vec3 finalCol = coreColor + vec3(0.55, 0.53, 0.48) * fresnel + vec3(1.0, 0.99, 0.96) * spec * 0.98;

    float coreAlpha = mix(0.20, 0.38, submergedInCup);
    float alpha = clamp(visibility * (coreAlpha + fresnel * 0.48 + spec * 0.62), 0.0, 0.9);
    gl_FragColor = vec4(finalCol, alpha);
  }
`;

export function DropParticles({
  iceCount,
  liquidTopY,
  liquidColor = "#7EA656",
  swirlImpulse = 0,
}: DropParticlesProps) {
  const rootRef = useRef<THREE.Group>(null);
  const swirlVelRef = useRef(0);
  const lastSwirlRef = useRef(swirlImpulse);

  if (swirlImpulse !== lastSwirlRef.current) {
    lastSwirlRef.current = swirlImpulse;
    swirlVelRef.current = 1.0;
  }

  const iceMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uLiquidColor: { value: new THREE.Color(liquidColor) },
          uLiquidTopY: { value: liquidTopY },
        },
        vertexShader: realIceVert,
        fragmentShader: realIceFrag,
        transparent: true,
        depthTest: true,
        depthWrite: true,
        side: THREE.FrontSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    return () => iceMaterial.dispose();
  }, [iceMaterial]);

  useEffect(() => {
    (iceMaterial.uniforms.uLiquidColor.value as THREE.Color).set(liquidColor);
  }, [liquidColor, iceMaterial]);

  // 22 Smooth RoundedBox Ice Cubes distributed across 4 vertical tiers from bottom to top of the cup
  const allIceCubes = useMemo(() => {
    const cupWallAtY = (y: number) => {
      const hNorm = Math.max(0, Math.min(1, (y - 0.05) / 1.02));
      return THREE.MathUtils.lerp(0.252, 0.368, hNorm) * 0.945;
    };

    const tiers = [
      { y: 0.19, count: 5, phase: 0.15, scale: 0.86 },
      { y: 0.42, count: 5, phase: 0.72, scale: 0.92 },
      { y: 0.65, count: 6, phase: 0.28, scale: 0.98 },
      { y: 0.88, count: 6, phase: 0.88, scale: 1.0 },
    ];

    const list: {
      x: number;
      y: number;
      z: number;
      rot: [number, number, number];
      size: [number, number, number];
    }[] = [];

    tiers.forEach((tier, tIdx) => {
      for (let i = 0; i < tier.count; i++) {
        const isCenterTop = tIdx === 3 && i === tier.count - 1;
        const angle = (i / (isCenterTop ? 1 : tier.count)) * Math.PI * 2 + tier.phase;
        const jitterY = ((i % 3) - 1) * 0.022;
        const yCube = tier.y + jitterY;
        const rWall = cupWallAtY(yCube) - 0.075 * tier.scale;
        const r = isCenterTop ? 0.02 : rWall;
        list.push({
          x: Math.cos(angle) * r,
          y: yCube,
          z: Math.sin(angle) * r,
          rot: [
            0.22 * (i + tIdx + 1),
            -angle + 0.3,
            0.18 * ((i + tIdx) % 2 === 0 ? 1 : -1),
          ],
          size: [
            0.132 * tier.scale,
            0.105 * tier.scale,
            0.128 * tier.scale,
          ],
        });
      }
    });

    return list;
  }, []);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;

    iceMaterial.uniforms.uLiquidTopY.value = liquidTopY;

    swirlVelRef.current *= Math.exp(-1.5 * dt);
    if (rootRef.current) {
      rootRef.current.rotation.y += swirlVelRef.current * dt * 4.8;
      rootRef.current.position.y = Math.sin(t * 2.0) * 0.004;
    }
  });

  if (iceCount <= 0) return null;

  return (
    <group ref={rootRef}>
      {allIceCubes.map((cube, idx) => (
        <RoundedBox
          key={`ice-${idx}`}
          args={cube.size}
          radius={0.034}
          smoothness={5}
          position={[cube.x, cube.y, cube.z]}
          rotation={cube.rot}
          renderOrder={3}
        >
          <primitive object={iceMaterial} attach="material" />
        </RoundedBox>
      ))}
    </group>
  );
}
