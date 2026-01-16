import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, ContactShadows, OrbitControls, Outlines } from '@react-three/drei';
import { Group, Mesh, Object3D } from 'three';

const RenderNode = ({ node }: { node: Object3D }) => {
    return (
        <group
            position={node.position}
            rotation={node.rotation}
            scale={node.scale}
        >
            {node instanceof Mesh && (
                <mesh geometry={node.geometry}>
                    <meshToonMaterial color="white" toneMapped={false} />
                    <Outlines thickness={2} color="black" />
                </mesh>
            )}
            {node.children.map((child) => (
                <RenderNode key={child.uuid} node={child} />
            ))}
        </group>
    );
};

const Model = () => {
    const group = useRef<Group>(null);
    // Load the GLB model from the public folder
    const { scene } = useGLTF('/haus.glb');

    // Add gentle auto-rotation
    useFrame((state) => {
        if (group.current) {
            // Initial rotation offset to match the desired starting view + slow rotation
            group.current.rotation.y = 2 + state.clock.getElapsedTime() * 0.2;
        }
    });

    return (
        <group ref={group} dispose={null}>
             <group scale={2} position={[0, -1, 0]}>
                <RenderNode node={scene} />
             </group>
        </group>
    );
};

export const BuildingModel = () => {
    return (
        <div className="w-full h-full">
            <Canvas
                camera={{ position: [200, 142, 244], fov: 35 }}
                dpr={[1, 2]} // Handle high pixel density screens
            >
                <ambientLight intensity={2.5} />
                <directionalLight position={[10, 10, 5]} intensity={1.5} />
                <directionalLight position={[-10, 10, -5]} intensity={1.5} />
                
                <Model />
                
                <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
                <OrbitControls 
                    enableZoom={false} 
                    autoRotate={false}
                    autoRotateSpeed={0.0015}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 2}
                />
            </Canvas>
        </div>
    );
};

// Preload the model
useGLTF.preload('/haus.glb');

