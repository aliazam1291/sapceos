"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GalaxyNode } from "./galaxyData";
import { spaceSound } from "@/lib/spaceSound";

interface GalaxyShipProps {
  focusedNode: GalaxyNode | null;
  onTelemetry: (msg: string) => void;
}

type ShipState = "idle" | "transit" | "orbit";

export default function GalaxyShip({ focusedNode, onTelemetry }: GalaxyShipProps) {
  const groupRef = useRef<THREE.Group>(null);
  const plumeRef = useRef<THREE.Mesh>(null);
  const scanConeRef = useRef<THREE.Mesh>(null);

  // Ship movement state
  const stateRef = useRef<ShipState>("idle");
  const currentPos = useRef(new THREE.Vector3(0, 0.4, 1.5));
  const targetPos = useRef(new THREE.Vector3(0, 0.4, 1.5));
  
  // Orbit parameters around focused node or central core
  const orbitAngle = useRef(Math.random() * Math.PI * 2);
  const orbitSpeed = 0.55;
  const lastFocusedNodeId = useRef<string | null>(null);

  // Visual effects state
  const [thrusterActive, setThrusterActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Web Audio trigger sync
  useEffect(() => {
    if (focusedNode) {
      // Trigger select ping sound
      spaceSound.playPing();
      
      const nodeName = focusedNode.title.toUpperCase();
      onTelemetry(`[NAV] VECTOR ACQUIRED FOR SYSTEM: ${nodeName}`);
      onTelemetry("[NAV] CALIBRATING ION ENGINES... STANDBY");
      
      setTimeout(() => {
        onTelemetry("[ENG] THRUST OVERLOAD 100%. INITIALIZING TRANSIT.");
        setThrusterActive(true);
        spaceSound.setThrusterActive(true);
        stateRef.current = "transit";
      }, 500);
      
      lastFocusedNodeId.current = focusedNode.id;
    } else {
      // Deselected
      if (lastFocusedNodeId.current) {
        onTelemetry("[NAV] SYSTEM DISENGAGED. RETURNING TO PATROL GRID.");
        setThrusterActive(true);
        spaceSound.setThrusterActive(true);
        setIsScanning(false);
        spaceSound.stopScanning();
        stateRef.current = "transit";
      }
      lastFocusedNodeId.current = null;
    }
  }, [focusedNode]);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;

    const dt = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;

    // Calculate current target position based on ship state
    if (stateRef.current === "idle") {
      // Slow patrol orbit around galactic center
      orbitAngle.current += dt * 0.15;
      const radius = 1.6;
      targetPos.current.set(
        Math.cos(orbitAngle.current) * radius,
        0.3 + Math.sin(orbitAngle.current * 2) * 0.15, // Figure eight vertical motion
        Math.sin(orbitAngle.current) * radius
      );
      
      // Face along the direction of motion
      const nextAngle = orbitAngle.current + 0.01;
      const nextPos = new THREE.Vector3(
        Math.cos(nextAngle) * radius,
        0.3 + Math.sin(nextAngle * 2) * 0.15,
        Math.sin(nextAngle) * radius
      );
      
      currentPos.current.lerp(targetPos.current, dt * 2.0);
      g.position.copy(currentPos.current);
      g.lookAt(nextPos);
      g.rotateX(0.08); // Slight banking
    } 
    else if (stateRef.current === "transit") {
      // Fly to focused node orbit entry, or back to central region
      let destination = new THREE.Vector3(0, 0.4, 1.5); // Default return
      
      if (focusedNode) {
        // Orbit entry point (offset from the node position)
        const [nx, ny, nz] = focusedNode.position;
        const orbitRadius = Math.max(0.45, focusedNode.size * 2.2);
        
        // Target is node position + offset along some orbit angle
        destination.set(
          nx + Math.cos(orbitAngle.current) * orbitRadius,
          ny + 0.1,
          nz + Math.sin(orbitAngle.current) * orbitRadius
        );
      } else {
        // Center patrol entry point
        const radius = 1.6;
        destination.set(
          Math.cos(orbitAngle.current) * radius,
          0.3,
          Math.sin(orbitAngle.current) * radius
        );
      }
      
      targetPos.current.copy(destination);
      
      // Calculate distance to target
      const dist = currentPos.current.distanceTo(targetPos.current);
      
      if (dist > 0.06) {
        // Look at target position during flight
        const lookTarget = targetPos.current.clone();
        
        // Interpolate position - fast acceleration, decelerates on arrival
        const speedMultiplier = Math.min(dist * 3.5, 4.8);
        currentPos.current.lerp(targetPos.current, dt * Math.max(speedMultiplier, 1.2));
        g.position.copy(currentPos.current);
        
        // Smoothly orient ship to face target
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.lookAt(g.position, lookTarget, new THREE.Vector3(0, 1, 0));
        const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(tempMatrix);
        g.quaternion.slerp(targetQuaternion, dt * 6);
        
        // Extreme banking roll during fast transit
        g.rotateZ(Math.sin(time * 8) * 0.05); 
      } else {
        // Arrived! Transition to orbit
        setThrusterActive(false);
        spaceSound.setThrusterActive(false);
        
        if (focusedNode) {
          stateRef.current = "orbit";
          setIsScanning(true);
          spaceSound.startScanning();
          onTelemetry(`[NAV] RETICLE DEPLOYED. ESTABLISHED STABLE ORBIT.`);
          onTelemetry(`[TEL] INITIATING LIDAR & SPECTROMETER SCAN.`);
        } else {
          stateRef.current = "idle";
          onTelemetry("[NAV] PATROL GRID PATTERN RESUMED. IDLE.");
        }
      }
    } 
    else if (stateRef.current === "orbit" && focusedNode) {
      // Orbiting around focused node
      const [nx, ny, nz] = focusedNode.position;
      const orbitRadius = Math.max(0.45, focusedNode.size * 2.2);
      
      orbitAngle.current += dt * orbitSpeed;
      
      // Orbiter coordinates
      targetPos.current.set(
        nx + Math.cos(orbitAngle.current) * orbitRadius,
        ny + Math.sin(orbitAngle.current * 0.5) * 0.1, // inclined weave
        nz + Math.sin(orbitAngle.current) * orbitRadius
      );
      
      currentPos.current.copy(targetPos.current);
      g.position.copy(currentPos.current);
      
      // Face tangential to the orbit path
      const nextAngle = orbitAngle.current + 0.02;
      const nextPos = new THREE.Vector3(
        nx + Math.cos(nextAngle) * orbitRadius,
        ny + Math.sin(nextAngle * 0.5) * 0.1,
        nz + Math.sin(nextAngle) * orbitRadius
      );
      
      g.lookAt(nextPos);
      
      // Tilt wings inward (banking)
      g.rotateZ(-0.25); 
      
      // Scanning cone animations
      if (scanConeRef.current) {
        // Point scanning cone directly at the node center
        const nodeVec = new THREE.Vector3(nx, ny, nz);
        scanConeRef.current.lookAt(nodeVec);
        // Point cone tip down (three.js ConeGeometry points along Y axis by default)
        scanConeRef.current.rotateX(Math.PI / 2);
        
        // Scan beam sweeping motion
        const sweepAngle = Math.sin(time * 4) * 0.08;
        scanConeRef.current.rotateZ(sweepAngle);
      }
    }

    // Engine thruster glow pulse
    if (plumeRef.current) {
      const pulse = 1.0 + Math.sin(time * 30) * 0.22;
      const scaleY = thrusterActive ? 2.4 * pulse : 0.65 * pulse;
      const scaleXZ = thrusterActive ? 1.4 : 0.8;
      plumeRef.current.scale.set(scaleXZ, scaleY, scaleXZ);
    }
  });

  // Construct detailed low-poly spaceship
  // Fuselage = Cylinder/Cone, Wings = thin boxes with detail, Engines = small cylinders
  return (
    <group ref={groupRef}>
      {/* Main Hull Body */}
      <mesh>
        <cylinderGeometry args={[0.012, 0.038, 0.38, 6]} />
        <meshStandardMaterial color="#101010" roughness={0.4} metalness={0.9} flatShading />
      </mesh>
      
      {/* Nose cone - Sensor block */}
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.012, 0.07, 6]} />
        <meshStandardMaterial color="#2e2e2e" roughness={0.2} metalness={0.8} flatShading />
      </mesh>
      
      {/* Left Wing & Solar Array */}
      <group position={[-0.1, -0.04, 0]} rotation={[0.1, 0, 0.15]}>
        {/* Wing arm */}
        <mesh>
          <boxGeometry args={[0.12, 0.007, 0.04]} />
          <meshStandardMaterial color="#101010" flatShading />
        </mesh>
        {/* Solar collector panel */}
        <mesh position={[-0.1, 0, 0]}>
          <boxGeometry args={[0.11, 0.004, 0.095]} />
          <meshStandardMaterial color="#1f3a30" roughness={0.1} emissive="#122a22" flatShading />
        </mesh>
        {/* Wing tip flashing LED */}
        <mesh position={[-0.16, 0, 0]}>
          <sphereGeometry args={[0.008, 4, 4]} />
          <meshBasicMaterial color="#ff3b30" />
        </mesh>
      </group>

      {/* Right Wing & Solar Array */}
      <group position={[0.1, -0.04, 0]} rotation={[0.1, 0, -0.15]}>
        {/* Wing arm */}
        <mesh>
          <boxGeometry args={[0.12, 0.007, 0.04]} />
          <meshStandardMaterial color="#101010" flatShading />
        </mesh>
        {/* Solar collector panel */}
        <mesh position={[0.1, 0, 0]}>
          <boxGeometry args={[0.11, 0.004, 0.095]} />
          <meshStandardMaterial color="#1f3a30" roughness={0.1} emissive="#122a22" flatShading />
        </mesh>
        {/* Wing tip flashing LED */}
        <mesh position={[0.16, 0, 0]}>
          <sphereGeometry args={[0.008, 4, 4]} />
          <meshBasicMaterial color="#34c759" />
        </mesh>
      </group>

      {/* Dorsal Fin */}
      <mesh position={[0, -0.05, -0.08]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.007, 0.09, 0.09]} />
        <meshStandardMaterial color="#101010" flatShading />
      </mesh>

      {/* Engine Cowl */}
      <mesh position={[0, -0.18, 0]}>
        <cylinderGeometry args={[0.038, 0.024, 0.08, 6]} />
        <meshStandardMaterial color="#2e2e2e" roughness={0.6} metalness={0.7} flatShading />
      </mesh>

      {/* Engine thruster fire plume (scales with thrust) */}
      <mesh ref={plumeRef} position={[0, -0.27, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.016, 0.16, 6]} />
        <meshBasicMaterial
          color="#3cdd9e"
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3D Scanning Cone (LIDAR scan beam) - visible only in orbit */}
      <mesh
        ref={scanConeRef}
        position={[0, 0.22, 0]}
        visible={isScanning}
      >
        {/* Radius top = small, radius bottom = wide cone, height = scanning range */}
        {/* cylinderGeometry, not coneGeometry: the taper needs a NARROW top and
            a wide bottom, and coneGeometry has no radiusTop — its signature is
            (radius, height, radialSegments, ...), so these six args landed on
            the wrong parameters and put `1` on the boolean `openEnded`. */}
        <cylinderGeometry args={[0.02, 0.28, 1.2, 8, 1, true]} />
        <meshBasicMaterial
          color="#3cdd9e"
          transparent
          opacity={0.16}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
