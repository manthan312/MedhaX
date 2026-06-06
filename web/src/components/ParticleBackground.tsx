import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

extend({ UnrealBloomPass });

const SpaceTimeSwarm: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 20000;
  const speedMult = 1;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);
  const color = pColor; // Alias for user code compatibility
  
  const positions = useMemo<THREE.Vector3[]>(() => {
     const pos: THREE.Vector3[] = [];
     for(let i=0; i<count; i++) {
       pos.push(new THREE.Vector3((Math.random()-0.5)*100, (Math.random()-0.5)*100, (Math.random()-0.5)*100));
     }
     return pos;
  }, []);

  // Material & Geom
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff }), []);
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.25), []);

  const PARAMS: Record<string, number> = useMemo(() => ({"scale":140,"freq":2.2,"amp":8,"speed":1.4,"wells":2,"pull":8,"twist":2}), []);
  const addControl = (id: string, _l: string, _min: number, _max: number, val: number) => {
      return PARAMS[id] !== undefined ? PARAMS[id] : val;
  };
  const setInfo = () => {};
  const annotate = () => {};

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speedMult;

    const rawMaterial = material as any;
    if(rawMaterial.uniforms && rawMaterial.uniforms.uTime) {
         rawMaterial.uniforms.uTime.value = time;
    }

    for (let i = 0; i < count; i++) {
        // USER CODE START
        const scale = addControl("scale", "Fabric Size", 40, 260, 140.0);
        const freq = addControl("freq", "Wave Frequency", 0.5, 6, 2.2);
        const amp = addControl("amp", "Wave Amplitude", 0, 20, 8.0);
        const speed = addControl("speed", "Flow Speed", 0, 4, 1.4);
        const wells = addControl("wells", "Gravity Wells", 0, 4, 2.0);
        const pull = addControl("pull", "Well Strength", 0, 20, 8.0);
        const twist = addControl("twist", "Shear Twist", 0, 6, 2.0);
        
        const t = time * speed;
        
        // map particles onto a continuous 2D fabric (square grid folded via index)
        const u = (Math.sin(i * 12.9898) * 43758.5453) % 1.0;
        const v = (Math.sin(i * 78.233) * 12345.6789) % 1.0;
        
        // center coordinates
        let x = (u * 2.0 - 1.0) * scale;
        let y = (v * 2.0 - 1.0) * scale;
        
        // base wave field (space-time ripples)
        const wave =
        Math.sin(x * 0.02 * freq + t) +
        Math.sin(y * 0.02 * freq - t * 0.8);
        
        let z = wave * amp;
        
        // multiple moving gravity wells (no arrays)
        const w1x = Math.sin(t * 0.3) * scale * 0.4;
        const w1y = Math.cos(t * 0.2) * scale * 0.4;
        
        const w2x = Math.sin(t * 0.5 + 2.0) * scale * 0.3;
        const w2y = Math.cos(t * 0.4 + 1.0) * scale * 0.3;
        
        // distance fields
        const dx1 = x - w1x;
        const dy1 = y - w1y;
        const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1 + 4.0);
        
        const dx2 = x - w2x;
        const dy2 = y - w2y;
        const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2 + 4.0);
        
        // gravitational curvature (fabric bending)
        const bend1 = -pull / d1;
        const bend2 = -pull / d2;
        
        // blend wells
        z += (bend1 + bend2) * (wells > 1.0 ? 1.0 : wells * 0.5);
        
        // shear twist (frame dragging illusion)
        const ang = twist * (bend1 - bend2);
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);
        
        const tx = x * cosA - y * sinA;
        const ty = x * sinA + y * cosA;
        
        target.set(tx, ty, z);
        
        // color based on curvature (depth + energy)
        const depth = Math.abs(z) / (amp + 0.001);
        const hue = (0.6 - depth * 0.5 + 0.1 * Math.sin(t)) % 1.0;
        const sat = 0.7 + 0.3 * depth;
        const light = 0.2 + 0.6 * (1.0 - depth);
        
        color.setHSL(hue, sat, light);
        
        if (i === 0) {
          setInfo();
          annotate();
        }
        // USER CODE END

        positions[i].lerp(target, 0.1);
        dummy.position.copy(positions[i]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, pColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  );
};

export const ParticleBackground: React.FC = () => {
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
      <Canvas camera={{ position: [0, 0, 100], fov: 60 }}>
        <fog attach="fog" args={['#020205', 0.01, 500]} />
        <SpaceTimeSwarm />
        <OrbitControls autoRotate={true} autoRotateSpeed={0.3} enableZoom={false} enablePan={false} />
        <Effects disableGamma>
          <unrealBloomPass threshold={0} strength={1.8} radius={0.4} />
        </Effects>
      </Canvas>
    </div>
  );
};

export default ParticleBackground;
