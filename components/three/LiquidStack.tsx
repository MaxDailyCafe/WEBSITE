"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { LiquidLayerSpec } from "@/lib/recipe-to-timeline";

interface LiquidStackProps {
  layers: LiquidLayerSpec[];
  fillLevel: number;
  mixProgress: number;
  mixStyle?: "mixed" | "layered";
  isPouring: boolean;
  sloshImpulse: number;
  swirlImpulse: number;
  bottomRadius: number;
  topRadius: number;
  height: number;
  baseY: number;
}

const liquidVert = /* glsl */ `
  uniform float uTime;
  uniform float uFill;
  uniform float uBottomRadius;
  uniform float uTopRadius;
  uniform float uCupHeight;
  uniform float uBaseY;
  uniform float uPouring;
  uniform float uSlosh;
  uniform float uSwirl;

  varying float vNormY;
  varying float vCupY;
  varying float vRadial;
  varying float vIsCap;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec2 vXz;

  void main() {
    vNormY = clamp(position.y, 0.0, 1.0);
    // Exact cap vs side-wall separation via vertex normal.y (1.0 on top cap, 0.0 on side wall)
    vIsCap = step(0.5, normal.y);

    float yCup = vNormY * uFill;
    vCupY = yCup;

    float rCup = mix(uBottomRadius, uTopRadius, yCup) * 0.945;
    vRadial = length(position.xz);
    vXz = position.xz;

    vec3 newPos = vec3(
      position.x * rCup,
      uBaseY + yCup * uCupHeight,
      position.z * rCup
    );

    float topMask = smoothstep(0.82, 1.0, vNormY);
    float centerDist = length(position.xz);
    float dropWave = sin(centerDist * 18.0 - uTime * 20.0) * 0.012 * uPouring * (1.0 - centerDist * 0.55) * vIsCap;
    float sloshWave = (position.x * sin(uTime * 7.0) + position.z * cos(uTime * 6.5)) * 0.022 * (uSlosh + uSwirl) * topMask;

    newPos.y += dropWave + sloshWave;

    vec4 worldPos = modelMatrix * vec4(newPos, 1.0);
    vPosW = worldPos.xyz;
    vec3 localN = vIsCap > 0.5 ? vec3(0.0, 1.0, 0.0) : normalize(vec3(position.x, -0.11, position.z));
    vNormalW = normalize(mat3(modelMatrix) * localN);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const liquidFrag = /* glsl */ `
  uniform float uTime;
  uniform float uFill;
  uniform float uMixProgress;
  uniform float uMixMode;
  uniform float uPouring;
  uniform float uSwirl;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uSplit;

  varying float vNormY;
  varying float vCupY;
  varying float vRadial;
  varying float vIsCap;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec2 vXz;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    if (uFill <= 0.01) discard;

    // Seamless 360-degree Cartesian noise (no atan branch seam or sawtooth artifacts)
    float s = sin(uSwirl * 2.5 + uTime * 0.18);
    float c = cos(uSwirl * 2.5 + uTime * 0.18);
    vec2 rotXz = vec2(vXz.x * c - vXz.y * s, vXz.x * s + vXz.y * c);

    float turb = fbm(vec2(rotXz.x * 2.4 + rotXz.y * 1.8, vCupY * 4.5 - uTime * 0.25));
    float softWave = (turb - 0.5) * 0.18;

    // 1. Soft organic layered transition (like cream slowly sinking into iced coffee)
    float layeredFactor = smoothstep(uSplit - 0.16 + softWave, uSplit + 0.14 + softWave, vCupY);
    vec3 layeredColor = mix(uColorA, uColorB, layeredFactor * clamp(uMixProgress * 1.35, 0.0, 1.0));

    // 2. Smooth full-cup mixed gradient
    float mixedGrad = smoothstep(0.05, 0.95, vNormY + softWave * 0.85);
    vec3 mixedColor = mix(uColorA, uColorB, mixedGrad * 0.65 + 0.2);
    vec3 harmonyTint = mix(uColorA, uColorB, 0.45) * 1.06;
    mixedColor = mix(mixedColor, harmonyTint, 0.4 * uMixProgress);

    vec3 col = mix(layeredColor, mixedColor, uMixMode * smoothstep(0.15, 0.95, uMixProgress));

    if (vIsCap > 0.5) {
      // Smooth top surface with silky crema ring and latte-art swirl
      float swirlPattern = fbm(rotXz * 3.2 + vec2(uTime * 0.15, -uTime * 0.15));
      vec3 topBase = mix(uColorA, uColorB, 0.65 * clamp(uMixProgress * 1.2, 0.0, 1.0));
      vec3 crema = vec3(0.96, 0.91, 0.82);
      col = mix(topBase, crema, swirlPattern * 0.35 + smoothstep(0.68, 1.0, vRadial) * 0.54);

      // Concentric pour ripple + center impact foam during overhead pour
      float rippleRing = sin(vRadial * 26.0 - uTime * 22.0) * 0.5 + 0.5;
      float impactGlow = smoothstep(0.42, 0.0, vRadial) * uPouring * 0.55;
      col = mix(col, vec3(0.99, 0.97, 0.92), clamp(impactGlow + rippleRing * uPouring * 0.14, 0.0, 0.85));
    } else {
      // Side wall shading + smooth silky micro-foam collar at top of drink
      vec3 viewDir = normalize(cameraPosition - vPosW);
      float fresnel = pow(1.0 - max(abs(dot(normalize(vNormalW), viewDir)), 0.0), 2.3);
      float aeration = (sin(vCupY * 22.0 - uTime * 11.0 + turb * 6.0) * 0.5 + 0.5) * uPouring;
      col *= mix(0.76, 1.06, vNormY);
      col += col * aeration * 0.14;
      col += (col * 0.34 + vec3(0.14, 0.11, 0.07)) * fresnel;

      // Smooth velvety crema collar near the top meniscus
      float cremaCollar = smoothstep(0.86, 0.992, vNormY);
      vec3 collarColor = mix(col * 1.15, vec3(0.95, 0.90, 0.81), 0.55);
      col = mix(col, collarColor, cremaCollar);

      // Crisp rising meniscus level line so cup filling level reads cleanly against the cup wall
      float meniscusLine = smoothstep(0.955, 0.996, vNormY);
      vec3 meniscusCol = mix(vec3(0.96, 0.91, 0.82), vec3(1.0, 0.98, 0.94), 0.35 + uPouring * 0.55);
      col = mix(col, meniscusCol, meniscusLine * (0.38 + uPouring * 0.52));
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function LiquidStack({
  layers,
  fillLevel,
  mixProgress,
  mixStyle = "mixed",
  isPouring,
  sloshImpulse,
  swirlImpulse,
  bottomRadius,
  topRadius,
  height,
  baseY,
}: LiquidStackProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const sloshRef = useRef(0);
  const swirlRef = useRef(0);
  const lastSloshRef = useRef(sloshImpulse);
  const lastSwirlRef = useRef(swirlImpulse);

  if (sloshImpulse !== lastSloshRef.current) {
    lastSloshRef.current = sloshImpulse;
    sloshRef.current = 1.0;
  }
  if (swirlImpulse !== lastSwirlRef.current) {
    lastSwirlRef.current = swirlImpulse;
    swirlRef.current = 1.0;
    sloshRef.current = 1.0;
  }

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(1, 1, 1, 72, 48, false);
    geo.translate(0, 0.5, 0);
    return geo;
  }, []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  const liquidMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uFill: { value: fillLevel },
          uBottomRadius: { value: bottomRadius },
          uTopRadius: { value: topRadius },
          uCupHeight: { value: height },
          uBaseY: { value: baseY },
          uPouring: { value: isPouring ? 1 : 0 },
          uSlosh: { value: 0 },
          uSwirl: { value: 0 },
          uMixProgress: { value: mixProgress },
          uMixMode: { value: mixStyle === "mixed" ? 1 : 0.22 },
          uColorA: { value: new THREE.Color(layers[0]?.color ?? "#7EA656") },
          uColorB: { value: new THREE.Color(layers[1]?.color ?? layers[0]?.color ?? "#3D2212") },
          uSplit: { value: layers[1]?.start ?? 0.56 },
        },
        vertexShader: liquidVert,
        fragmentShader: liquidFrag,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    return () => {
      liquidMaterial.dispose();
    };
  }, [liquidMaterial]);

  useEffect(() => {
    const u = liquidMaterial.uniforms;
    u.uBottomRadius.value = bottomRadius;
    u.uTopRadius.value = topRadius;
    u.uCupHeight.value = height;
    u.uBaseY.value = baseY;
  }, [bottomRadius, topRadius, height, baseY, liquidMaterial]);

  useEffect(() => {
    const u = liquidMaterial.uniforms;
    const cA = layers[0]?.color ?? "#7EA656";
    const cB = layers[1]?.color ?? cA;
    (u.uColorA.value as THREE.Color).set(cA);
    (u.uColorB.value as THREE.Color).set(cB);
    u.uSplit.value = layers[1]?.start ?? 0.56;
  }, [layers, liquidMaterial]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const u = liquidMaterial.uniforms;
    u.uTime.value += dt;

    if (fillLevel <= 0.06 && u.uFill.value > 0.12) {
      // Snap cleanly to empty at pour start so rising fill level syncs 1:1 with the incoming stream
      u.uFill.value = fillLevel;
    } else {
      const rate = isPouring ? 34.0 : 14.0;
      const ease = 1 - Math.exp(-rate * dt);
      u.uFill.value += (fillLevel - u.uFill.value) * ease;
    }

    u.uMixProgress.value += (mixProgress - u.uMixProgress.value) * (1 - Math.exp(-6.5 * dt));
    u.uMixMode.value +=
      ((mixStyle === "mixed" ? 1.0 : 0.22) - u.uMixMode.value) * (1 - Math.exp(-6.0 * dt));
    u.uPouring.value += ((isPouring ? 1.0 : 0.0) - u.uPouring.value) * (1 - Math.exp(-12.0 * dt));

    sloshRef.current *= Math.exp(-2.2 * dt);
    swirlRef.current *= Math.exp(-1.5 * dt);
    u.uSlosh.value = sloshRef.current;
    u.uSwirl.value = swirlRef.current;

    if (meshRef.current) {
      meshRef.current.rotation.y += swirlRef.current * dt * 4.2;
      meshRef.current.visible = u.uFill.value > 0.008;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={liquidMaterial}
      renderOrder={2}
      frustumCulled={false}
    />
  );
}
