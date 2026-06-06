import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

extend({ UnrealBloomPass });

interface ParticleSwarmProps {
  scrollRef: React.RefObject<number>;
  mouseRef: React.RefObject<{ x: number; y: number }>;
}

const ParticleSwarm: React.FC<ParticleSwarmProps> = ({ scrollRef, mouseRef }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 20000;
  const speedMult = 0.8;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);

  // Initialize positions array with 3D Vectors
  const positions = useMemo(() => {
    const pos: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      pos.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 200
        )
      );
    }
    return pos;
  }, []);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.25), []);

  // Target vectors for camera smoothing
  const targetCamPos = useMemo(() => new THREE.Vector3(0, 35, 150), []);
  const targetLookAt = useMemo(() => new THREE.Vector3(0, 5, 0), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speedMult;

    // ─── Scroll-based Camera & Parameter Interpolation ───
    const scrollY = scrollRef.current ?? 0;
    
    // Determine target camera positions and dune characteristics based on page scroll
    let waveHeight = 25;
    let windSpeed = 1.8;
    let flowStrength = 2.0;

    if (scrollY < 800) {
      // Hero section: camera high up, looking down at massive dunes
      const t = scrollY / 800;
      targetCamPos.set(
        THREE.MathUtils.lerp(0, -35, t),
        THREE.MathUtils.lerp(35, 20, t),
        THREE.MathUtils.lerp(150, 130, t)
      );
      targetLookAt.set(0, 5, 0);
      waveHeight = THREE.MathUtils.lerp(25, 15, t); // Flatten slightly for the content sections
    } else if (scrollY < 1600) {
      // Features/How it works: camera lower and shifted right, flatter waves
      const t = (scrollY - 800) / 800;
      targetCamPos.set(
        THREE.MathUtils.lerp(-35, 35, t),
        THREE.MathUtils.lerp(20, 25, t),
        THREE.MathUtils.lerp(130, 110, t)
      );
      targetLookAt.set(0, -5, 0);
      waveHeight = 15;
    } else {
      // CTA banner/Footer: camera low, dramatic wind, particles swooping upwards
      const t = Math.min((scrollY - 1600) / 1000, 1);
      targetCamPos.set(
        THREE.MathUtils.lerp(35, 0, t),
        THREE.MathUtils.lerp(25, 8, t),
        THREE.MathUtils.lerp(110, 70, t)
      );
      targetLookAt.set(0, THREE.MathUtils.lerp(-5, 12, t), THREE.MathUtils.lerp(0, -25, t));
      waveHeight = THREE.MathUtils.lerp(15, 30, t);
      windSpeed = THREE.MathUtils.lerp(1.8, 3.2, t);
      flowStrength = THREE.MathUtils.lerp(2.0, 4.5, t);
    }

    // Apply camera lerping for cinematic transitions
    state.camera.position.lerp(targetCamPos, 0.05);

    // Dynamic mouse parallax on the camera position
    const mx = mouseRef.current?.x ?? 0;
    const my = mouseRef.current?.y ?? 0;
    state.camera.position.x += mx * 15;
    state.camera.position.y += my * 8;

    // Smoothly focus camera
    state.camera.lookAt(targetLookAt);

    // ─── Particle Animation Update Loop ───
    for (let i = 0; i < count; i++) {
      const duneSize = 120;
      const wind = windSpeed;
      const flow = flowStrength;
      const height = waveHeight;
      const chaos = 1.2;
      const drift = 1.5;
      const swirl = 1.0;

      const p = i / count;

      const grid = Math.sqrt(count);
      const gx = (i % grid) / grid - 0.5;
      const gz = ((i / grid) | 0) / grid - 0.5;

      const px = gx * duneSize * 8.0;
      const pz = gz * duneSize * 8.0;

      const t = time * wind;

      // Base Wave Calculations
      const wave1 = Math.sin(px * 0.018 + t) * Math.cos(pz * 0.012 - t * 0.7);
      const wave2 = Math.sin((px + pz) * 0.01 - t * 1.3) * Math.cos((px - pz) * 0.014 + t * 0.5);
      const wave3 = Math.sin(px * 0.05 + p * 40.0 + t * 2.0) * 0.3;

      const dune = (wave1 + wave2 + wave3) * height;

      // Mouse local turbulence
      // Map world coords back to find proximity to cursor, adding interactive wave distortion
      const distToCursor = Math.sqrt(Math.pow(px - mx * 80, 2) + Math.pow(pz - my * 80, 2));
      const cursorInfluence = distToCursor < 40 ? (1.0 - distToCursor / 40) * 8.0 : 0;

      const turbulence = Math.sin(px * 0.03 + pz * 0.02 + t * 4.0 + p * 120.0) * (chaos + cursorInfluence * 0.5);

      const driftOffset = Math.sin(p * 300.0 + t * 3.0) * drift * (0.2 + Math.abs(wave1));

      const spiral = Math.sin(Math.sqrt(px * px + pz * pz) * 0.02 - t * 2.5) * swirl;

      const x = px + driftOffset + spiral * 6.0;
      const y = dune + turbulence + cursorInfluence;
      const z = pz + t * flow * 8.0 + Math.cos(p * 220.0 + t) * drift;

      target.set(x, y, z);

      // Color computation based on movement and waves
      const brightness = 0.45 + 0.25 * Math.abs(wave1) + 0.15 * Math.abs(spiral);
      
      // Dynamic hue shifts from cyan/blue to indigo/purple based on dune height
      const hue = 0.55 + 0.15 * Math.sin(dune * 0.02 + time * 0.1); 
      const saturation = 0.75 + turbulence * 0.01;
      const lightness = brightness * 0.6; // keep slightly dimmer for readability

      pColor.setHSL(hue, saturation, lightness);

      // Update position (interpolated for fluidity)
      positions[i].lerp(target, 0.1);
      dummy.position.copy(positions[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, pColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
};

export const ParticleBackground: React.FC = () => {
  const scrollRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1 range
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#020205', // Deep space dark background
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <Canvas camera={{ position: [0, 35, 150], fov: 60, near: 1, far: 1000 }}>
        <fog attach="fog" args={['#020205', 10, 450]} />
        <ParticleSwarm scrollRef={scrollRef} mouseRef={mouseRef} />
        <Effects disableGamma>
          <unrealBloomPass threshold={0} strength={1.6} radius={0.4} />
        </Effects>
      </Canvas>
    </div>
  );
};

export default ParticleBackground;
