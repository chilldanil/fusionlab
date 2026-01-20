import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { ANIMATION_CONFIG } from '../constants/animation';

interface EnergyPulse {
    id: number;
    x: number;
    y: number;
    direction: 'horizontal' | 'vertical';
    length: number;
    speed: number;
    width: number;
    originX: 0 | 1;
    originY: 0 | 1;
}

interface Collision {
    id: number;
    x: number;
    y: number;
    type: 'spark';
    createdAt: number;
}

interface TechMarker {
    id: number;
    x: number;
    y: number;
    type: 'cross' | 'bracket' | 'corner';
}

interface DecorativeNumber {
    id: number;
    top: string;
    left: string;
    label: string;
}

export const AnimatedCircuitBackground: React.FC = () => {
    const [pulses, setPulses] = useState<EnergyPulse[]>([]);
    const [collisions, setCollisions] = useState<Collision[]>([]);
    const [markers, setMarkers] = useState<TechMarker[]>([]);
    const [decorativeNumbers, setDecorativeNumbers] = useState<DecorativeNumber[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [prefersReducedMotion] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    // Generate static/passive tech markers
    useEffect(() => {
        if (prefersReducedMotion) return;
        const gridSize = 40;
        const cols = Math.ceil(window.innerWidth / gridSize);
        const rows = Math.ceil(window.innerHeight / gridSize);
        const newMarkers: TechMarker[] = [];

        // Add some random crosshairs
        for (let i = 0; i < 15; i++) {
            newMarkers.push({
                id: i,
                x: Math.floor(Math.random() * cols) * gridSize,
                y: Math.floor(Math.random() * rows) * gridSize,
                type: 'cross'
            });
        }
        
        // Add some "zone" corners
        for (let i = 0; i < 6; i++) {
             newMarkers.push({
                id: i + 100,
                x: Math.floor(Math.random() * cols) * gridSize,
                y: Math.floor(Math.random() * rows) * gridSize,
                type: 'corner'
            });
        }

        setMarkers(newMarkers);
    }, [prefersReducedMotion]);

    useEffect(() => {
        if (prefersReducedMotion || decorativeNumbers.length > 0) return;
        const numbers = Array.from({ length: 5 }, (_, index) => ({
            id: index,
            top: `${Math.random() * 90 + 5}%`,
            left: `${Math.random() * 90 + 5}%`,
            label: `SYS.0${index + 1}_RC${Math.floor(Math.random() * 99)}`,
        }));
        setDecorativeNumbers(numbers);
    }, [decorativeNumbers.length, prefersReducedMotion]);

    // Generate a new energy pulse
    const createPulse = (): EnergyPulse => {
        const isHorizontal = Math.random() > 0.5;
        const gridSize = 40;
        
        // Snap to grid
        const x = Math.floor(Math.random() * (window.innerWidth / gridSize)) * gridSize;
        const y = Math.floor(Math.random() * (window.innerHeight / gridSize)) * gridSize;
        
        return {
            id: Date.now() + Math.random(),
            x,
            y,
            direction: isHorizontal ? 'horizontal' : 'vertical',
            length: Math.random() * 400 + 100, // Longer lines
            speed: Math.random() * 0.8 + 0.4, // Faster speed (lower duration)
            width: Math.random() > 0.8 ? 2 : 1, // Occasional thicker lines
            originX: Math.random() > 0.5 ? 0 : 1,
            originY: Math.random() > 0.5 ? 0 : 1,
        };
    };

    useEffect(() => {
        if (prefersReducedMotion) return;
        // Main spawner loop
        const interval = setInterval(() => {
            // Spawn multiple pulses in a burst
            const count = Math.floor(Math.random() * 4) + 1; 
            const newPulses = Array.from({ length: count }, createPulse);
            
            setPulses(prev => {
                // Keep a reasonable number of active pulses
                const updated = [...prev, ...newPulses];
                return updated.slice(-ANIMATION_CONFIG.circuitBackground.maxPulses);
            });
        }, ANIMATION_CONFIG.circuitBackground.pulseInterval);

        return () => clearInterval(interval);
    }, [prefersReducedMotion]);

    // Collision/Spark generator
    useEffect(() => {
        if (prefersReducedMotion) return;

        const collisionInterval = setInterval(() => {
            if (pulses.length > 0 && Math.random() > 0.5) {
                const target = pulses[Math.floor(Math.random() * pulses.length)];
                const offset = Math.random() * target.length;
                const now = Date.now();

                const collision: Collision = {
                    id: now,
                    x: target.direction === 'horizontal' ? target.x + offset : target.x,
                    y: target.direction === 'vertical' ? target.y + offset : target.y,
                    type: 'spark',
                    createdAt: now,
                };

                setCollisions(prev => [...prev, collision]);
            }
        }, ANIMATION_CONFIG.circuitBackground.collisionInterval);

        const cleanupInterval = setInterval(() => {
            const now = Date.now();
            setCollisions(prev => prev.filter(c => now - c.createdAt < ANIMATION_CONFIG.circuitBackground.collisionTtl));
        }, ANIMATION_CONFIG.circuitBackground.collisionCleanupInterval);

        return () => {
            clearInterval(collisionInterval);
            clearInterval(cleanupInterval);
        };
    }, [prefersReducedMotion, pulses]);

    if (prefersReducedMotion) {
        return null;
    }

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            {/* Static Grid - Base Layer */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Passive Tech Markers - Layer 2 */}
            {markers.map((marker) => (
                <div 
                    key={marker.id}
                    className="absolute text-gray-300/50 font-mono text-[10px]"
                    style={{ left: marker.x, top: marker.y }}
                >
                    {marker.type === 'cross' && (
                        <div className="relative -translate-x-1/2 -translate-y-1/2 w-3 h-3">
                            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-current" />
                            <div className="absolute left-1/2 top-0 h-full w-[1px] bg-current" />
                        </div>
                    )}
                    {marker.type === 'corner' && (
                         <div className="relative w-4 h-4 border-t border-l border-gray-300/50" />
                    )}
                </div>
            ))}

            {/* Random decorative numbers - Layer 3 */}
            <div className="absolute inset-0">
                {decorativeNumbers.map((decorative) => (
                    <div
                        key={decorative.id}
                        className="absolute font-mono text-[9px] text-gray-200 tracking-widest"
                        style={{
                            top: decorative.top,
                            left: decorative.left,
                            transform: 'rotate(-90deg)',
                            opacity: 0.3
                        }}
                    >
                        {decorative.label}
                    </div>
                ))}
            </div>


            {/* Active Energy Pulses - Layer 4 */}
            <AnimatePresence>
                {pulses.map((pulse) => (
                    <motion.div
                        key={pulse.id}
                        className="absolute bg-black"
                        style={{
                            left: pulse.x,
                            top: pulse.y,
                            width: pulse.direction === 'horizontal' ? pulse.length : pulse.width,
                            height: pulse.direction === 'vertical' ? pulse.length : pulse.width,
                        }}
                        initial={{ 
                            scaleX: pulse.direction === 'horizontal' ? 0 : 1,
                            scaleY: pulse.direction === 'vertical' ? 0 : 1,
                            opacity: 0,
                            originX: pulse.originX, 
                            originY: pulse.originY,
                        }}
                        animate={{ 
                            scaleX: 1,
                            scaleY: 1,
                            opacity: [0, 0.8, 0], 
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ 
                            duration: pulse.speed,
                            ease: "easeOut"
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* Collision Sparks - Layer 5 */}
            <AnimatePresence>
                {collisions.map((collision) => (
                    <motion.div
                        key={collision.id}
                        className="absolute w-0 h-0"
                        style={{ left: collision.x, top: collision.y }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, opacity: [1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="absolute -translate-x-1/2 -translate-y-1/2">
                            <div className="relative">
                                <div className="absolute w-8 h-[1px] bg-black rotate-45 -left-4" />
                                <div className="absolute w-8 h-[1px] bg-black -rotate-45 -left-4" />
                                <div className="absolute w-2 h-2 border border-black rounded-full -left-1 -top-1" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
