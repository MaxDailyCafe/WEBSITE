"use client";

import { Suspense, useEffect, useRef, useState, type ComponentRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { BuiltRecipe } from "@/lib/recipe-to-timeline";
import type { VesselType } from "@/lib/rules/types";
import { KraftHotCup } from "./KraftHotCup";
import { ClearIcedCup } from "./ClearIcedCup";
import { LiquidStack } from "./LiquidStack";
import { PourStream } from "./PourStream";
import { DropParticles } from "./DropParticles";
import { OakPlate } from "./OakPlate";

interface MaxDailyCanvasProps {
  vessel: VesselType;
  recipe: BuiltRecipe;
  currentFill: number;
  mixProgress: number;
  mixStyle?: "mixed" | "layered";
  cupScale?: number;
  cutaway?: boolean;
  isPouring?: boolean;
  showHotLid?: boolean;
  pourColor?: string;
  pourThickness?: number;
  sloshImpulse?: number;
  swirlImpulse?: number;
  layersMerged?: boolean;
  onDoubleTap?: () => void;
  className?: string;
}

function VerdeAbetoCoaster() {
  return (
    <group position={[0, -0.04, 0]}>
      {/* Sculpted Verde Abeto Luxury Coaster Pedestal */}
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[0.88, 0.94, 0.065, 64]} />
        <meshStandardMaterial color="#0D2419" roughness={0.65} metalness={0.08} />
      </mesh>
      {/* Rojo Tomate Accent Ring */}
      <mesh position={[0, 0.034, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.81, 0.845, 64]} />
        <meshStandardMaterial color="#D9381E" roughness={0.28} metalness={0.45} />
      </mesh>
    </group>
  );
}

function CameraChoreographer({
  isPouring,
  vessel,
  showHotLid,
  controlsRef,
}: {
  isPouring: boolean;
  vessel: VesselType;
  showHotLid: boolean;
  controlsRef: React.RefObject<ComponentRef<typeof OrbitControls> | null>;
}) {
  const transitionTimerRef = useRef(1.1);

  useEffect(() => {
    transitionTimerRef.current = 1.25;
  }, [vessel, isPouring, showHotLid]);

  useFrame(({ camera }, delta) => {
    if (transitionTimerRef.current <= 0) return;
    const dt = Math.min(delta, 0.05);
    transitionTimerRef.current -= dt;

    // Elevated top-down barista framing for open Hot Drinks so you see the drink inside the top of the cup
    let targetY = 1.06;
    let targetRadiusXZ = 2.34;
    let targetLookY = 0.08;

    if (isPouring) {
      targetY = vessel === "kraft_hot" ? 1.52 : 1.24;
      targetRadiusXZ = 2.54;
      targetLookY = 0.28;
    } else if (vessel === "kraft_hot" && !showHotLid) {
      targetY = 1.84;
      targetRadiusXZ = 1.98;
      targetLookY = 0.16;
    } else if (vessel === "oak_plate") {
      targetY = 1.28;
      targetRadiusXZ = 2.26;
      targetLookY = 0.08;
    }

    const k = 1 - Math.exp(-4.2 * dt);
    const curRadiusXZ = Math.hypot(camera.position.x, camera.position.z) || targetRadiusXZ;
    const theta = Math.atan2(camera.position.x, camera.position.z);
    const nextRadiusXZ = THREE.MathUtils.lerp(curRadiusXZ, targetRadiusXZ, k);

    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, k);
    camera.position.x = Math.sin(theta) * nextRadiusXZ;
    camera.position.z = Math.cos(theta) * nextRadiusXZ;

    if (controlsRef.current) {
      controlsRef.current.target.y = THREE.MathUtils.lerp(
        controlsRef.current.target.y,
        targetLookY,
        k
      );
      controlsRef.current.update();
    }
  });
  return null;
}

export function MaxDailyCanvas({
  vessel,
  recipe,
  currentFill,
  mixProgress,
  mixStyle = "mixed",
  cupScale = 1,
  cutaway = false,
  isPouring = false,
  showHotLid = false,
  pourColor = "#7EA656",
  pourThickness = 0.046,
  sloshImpulse = 1,
  swirlImpulse = 0,
  layersMerged = false,
  onDoubleTap,
  className = "h-full w-full",
}: MaxDailyCanvasProps) {
  const [webglOk, setWebglOk] = useState(true);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") || c.getContext("webgl"))) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  if (!webglOk) {
    return (
      <div className={`flex items-center justify-center p-6 text-xs text-[#F5EFE2] ${className}`}>
        3D Preview
      </div>
    );
  }

  const cupInteriorHeight = vessel === "kraft_hot" ? 0.92 : 1.02;
  const surfaceY = 0.05 + currentFill * cupInteriorHeight;

  return (
    <div className={`relative touch-none select-none ${className}`} onDoubleClick={onDoubleTap}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.06, 2.34], fov: 35 }}
        gl={{ antialias: true, toneMappingExposure: 1.12 }}
      >
        <CameraChoreographer
          isPouring={isPouring}
          vessel={vessel}
          showHotLid={showHotLid}
          controlsRef={controlsRef}
        />

        {/* Studio Lighting */}
        <ambientLight intensity={0.88} color="#FAF6EE" />
        <directionalLight position={[2.2, 3.8, 2.6]} intensity={2.5} color="#FFF7EB" castShadow />
        <pointLight position={[-1.9, 1.5, -1.4]} intensity={1.3} color="#F5EFE2" />
        <pointLight position={[0, 2.0, 1.1]} intensity={0.95} color={pourColor} />

        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.4} />

          <group position={[0, -0.47, 0]}>
            <VerdeAbetoCoaster />

            {vessel === "oak_plate" ? (
              <group>
                <OakPlate
                  glazeColor={recipe.dessertGlazeColor}
                  crunchColor={recipe.dessertCrunchColor}
                  merged={layersMerged}
                />
                <PourStream
                  active={isPouring}
                  color={recipe.dessertGlazeColor}
                  thickness={0.042}
                  surfaceY={layersMerged ? 0.39 : 0.68}
                  spoutY={1.48}
                />
              </group>
            ) : (
              <group scale={cupScale}>
                {vessel === "kraft_hot" ? (
                  <KraftHotCup
                    cutaway={cutaway || isPouring}
                    showLid={showHotLid && !isPouring && !cutaway}
                  />
                ) : (
                  <ClearIcedCup cutaway={cutaway || isPouring} showLid={!isPouring && !cutaway} />
                )}

                <LiquidStack
                  layers={recipe.layers}
                  fillLevel={currentFill}
                  mixProgress={mixProgress}
                  mixStyle={mixStyle}
                  isPouring={isPouring}
                  sloshImpulse={sloshImpulse}
                  swirlImpulse={swirlImpulse}
                  bottomRadius={vessel === "kraft_hot" ? 0.286 : 0.252}
                  topRadius={vessel === "kraft_hot" ? 0.401 : 0.368}
                  height={cupInteriorHeight}
                  baseY={0.05}
                />

                <PourStream
                  active={isPouring}
                  color={pourColor}
                  thickness={pourThickness}
                  surfaceY={surfaceY}
                  spoutY={1.44}
                />

                {vessel === "clear_iced" && (
                  <DropParticles
                    iceCount={recipe.iceCount}
                    garnishKind={recipe.garnishKind}
                    garnishCount={recipe.garnishCount}
                    liquidTopY={surfaceY}
                    liquidColor={
                      recipe.layers[recipe.layers.length - 1]?.color ?? pourColor
                    }
                    dropSeed={sloshImpulse}
                    swirlImpulse={swirlImpulse}
                  />
                )}
              </group>
            )}

            <ContactShadows
              position={[0, -0.008, 0]}
              opacity={0.55}
              scale={3.6}
              blur={1.8}
              far={2.0}
              color="#06120C"
            />
          </group>
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          target={[0, 0.08, 0]}
          enablePan={false}
          enableDamping
          dampingFactor={0.06}
          minDistance={1.55}
          maxDistance={3.4}
          minPolarAngle={Math.PI * 0.12}
          maxPolarAngle={Math.PI * 0.49}
        />
      </Canvas>
    </div>
  );
}
