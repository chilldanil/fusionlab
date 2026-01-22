// ═══════════════════════════════════════════════════════════════════════════
// 3D MODEL SHOWCASE PAGE
// ═══════════════════════════════════════════════════════════════════════════
// Separate page for testing and showcasing the building model
// Route: /model

import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  useGLTF,
  OrbitControls,
  Environment,
  ContactShadows,
  PerspectiveCamera,
  Html,
  useProgress,
  Center,
  Grid
} from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// LOADING COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const Loader = () => {
  const { progress } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);

  // Update progress in useEffect to avoid setState during render
  useEffect(() => {
    setDisplayProgress(progress);
  }, [progress]);

  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-black border-t-transparent animate-spin" />
        <div className="font-mono text-sm text-black uppercase tracking-wider">
          Loading Model... {Math.round(displayProgress)}%
        </div>
        <div className="w-48 h-2 bg-gray-200 border-2 border-black overflow-hidden">
          <motion.div
            className="h-full bg-black"
            style={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    </Html>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3D MODEL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface ModelProps {
  modelPath: string;
  scale?: number;
  position?: [number, number, number];
  enableAutoRotate?: boolean;
  rotationSpeed?: number;
}

const Model = ({ 
  modelPath, 
  scale = 1,
  position = [0, 0, 0],
  enableAutoRotate = false,
  rotationSpeed = 0.002
}: ModelProps) => {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  
  // Auto-rotation
  useFrame(() => {
    if (group.current && enableAutoRotate) {
      group.current.rotation.y += rotationSpeed;
    }
  });
  
  // Apply monochrome style to materials
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        // Make materials monochrome for your design system
        if (mesh.material) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          
          // Convert to grayscale
          if (material.color) {
            const hsl = { h: 0, s: 0, l: 0 };
            material.color.getHSL(hsl);
            material.color.setHSL(0, 0, hsl.l); // Remove saturation
          }
          
          // Enable shadows
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          
          // Enhance material for neo-brutalist look
          material.metalness = 0.1;
          material.roughness = 0.8;
        }
      }
    });
  }, [scene]);
  
  return (
    <group ref={group} position={position} scale={scale}>
      <primitive object={scene} />
    </group>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTING PRESETS
// ─────────────────────────────────────────────────────────────────────────────

type LightingPreset = 'studio' | 'outdoor' | 'minimal' | 'dramatic';

const LightingSetup = ({ preset }: { preset: LightingPreset }) => {
  switch (preset) {
    case 'studio':
      return (
        <>
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <directionalLight position={[-10, 5, -5]} intensity={0.5} />
          <directionalLight position={[0, 10, -10]} intensity={0.3} />
        </>
      );
    
    case 'outdoor':
      return (
        <>
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[50, 50, 25]} 
            intensity={1.5} 
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <hemisphereLight color="#87CEEB" groundColor="#666" intensity={0.5} />
        </>
      );
    
    case 'minimal':
      return (
        <>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
        </>
      );
    
    case 'dramatic':
      return (
        <>
          <ambientLight intensity={0.1} />
          <directionalLight position={[10, 10, 5]} intensity={2} castShadow />
          <directionalLight position={[0, 5, -10]} intensity={0.3} color="#4a90e2" />
        </>
      );
    
    default:
      return <ambientLight intensity={0.5} />;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export const ModelShowcasePage = () => {
  // State
  const [modelPath] = useState('/models/reproduction_of_metropolitan_palace.glb');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('studio');
  const [showGrid, setShowGrid] = useState(true);
  const [showShadows, setShowShadows] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [modelScale, setModelScale] = useState(1);
  
  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 px-6 py-4 bg-white/90 backdrop-blur-sm border-b-2 border-black"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-mono tracking-tight">3D MODEL VIEWER</h1>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">
              Interactive Building Showcase
            </p>
          </div>
          
          <a
            href="/"
            className="px-4 py-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-all font-mono text-xs uppercase tracking-wider"
          >
            ← Back to Landing
          </a>
        </div>
      </motion.header>
      
      {/* 3D Canvas */}
      <div className="absolute inset-0 pt-20">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [5, 3, 5], fov: 50 }}
          gl={{ 
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
          }}
        >
          <Suspense fallback={<Loader />}>
            {/* Camera */}
            <PerspectiveCamera makeDefault position={[5, 3, 5]} />
            
            {/* Lighting based on preset */}
            <LightingSetup preset={lightingPreset} />
            
            {/* Environment map for reflections */}
            <Environment preset="city" background={false} />
            
            {/* Grid */}
            {showGrid && (
              <Grid
                args={[20, 20]}
                cellSize={1}
                cellThickness={1}
                cellColor="#999"
                sectionSize={5}
                sectionThickness={1.5}
                sectionColor="#666"
                fadeDistance={30}
                fadeStrength={1}
                followCamera={false}
                infiniteGrid
              />
            )}
            
            {/* Model */}
            <Center>
              <Model
                modelPath={modelPath}
                scale={modelScale}
                enableAutoRotate={autoRotate}
              />
            </Center>
            
            {/* Shadows */}
            {showShadows && (
              <ContactShadows
                position={[0, 0, 0]}
                opacity={0.5}
                scale={20}
                blur={2}
                far={4}
              />
            )}
            
            {/* Controls */}
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={2}
              maxDistance={20}
              maxPolarAngle={Math.PI / 2}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-24 right-6 w-64 bg-white border-2 border-black p-4 space-y-4 z-20"
      >
        <h3 className="font-mono text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-2">
          Controls
        </h3>
        
        {/* Lighting Preset */}
        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-gray-700 block mb-2">
            Lighting
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['studio', 'outdoor', 'minimal', 'dramatic'] as LightingPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => setLightingPreset(preset)}
                className={`px-3 py-2 text-xs font-mono uppercase border-2 transition-all ${
                  lightingPreset === preset
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:border-black'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        
        {/* Scale */}
        <div>
          <label className="font-mono text-xs uppercase tracking-wider text-gray-700 block mb-2">
            Scale: {modelScale.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={modelScale}
            onChange={(e) => setModelScale(parseFloat(e.target.value))}
            className="w-full accent-black"
          />
        </div>
        
        {/* Toggles */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
              className="accent-black"
            />
            <span className="font-mono text-xs uppercase tracking-wider">Auto Rotate</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="accent-black"
            />
            <span className="font-mono text-xs uppercase tracking-wider">Show Grid</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showShadows}
              onChange={(e) => setShowShadows(e.target.checked)}
              className="accent-black"
            />
            <span className="font-mono text-xs uppercase tracking-wider">Show Shadows</span>
          </label>
        </div>
        
        {/* Info */}
        <div className="pt-4 border-t border-gray-200">
          <p className="font-mono text-[10px] text-gray-500 uppercase tracking-wider mb-1">
            Controls
          </p>
          <ul className="font-mono text-[10px] text-gray-600 space-y-1">
            <li>• Left Click + Drag: Rotate</li>
            <li>• Right Click + Drag: Pan</li>
            <li>• Scroll: Zoom</li>
          </ul>
        </div>
      </motion.div>
      
      {/* Stats Overlay */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm border-2 border-black px-4 py-3 font-mono text-xs"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="uppercase tracking-wider">Ready</span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">Model loaded</span>
        </div>
      </motion.div>
    </div>
  );
};

// Preload the model for faster loading
useGLTF.preload('/models/reproduction_of_metropolitan_palace.glb');