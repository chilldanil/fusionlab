import { useEffect, useRef } from 'react';
import { SeededRandom, stringToSeed } from '../lib/generator-utils';
import { clsx } from 'clsx';

interface SchematicAvatarProps {
    seed: string;
    size?: number;
    className?: string;
}

export const SchematicAvatar = ({ seed, size = 128, className }: SchematicAvatarProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle high DPI displays for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, size, size);

        // Setup generator
        const numericSeed = stringToSeed(seed);
        const rng = new SeededRandom(numericSeed);

        // Drawing Configuration
        const gridSize = 8;
        const cellSize = size / gridSize;
        const padding = cellSize / 2;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'square';

        // Draw faint grid (optional, keeping it very subtle)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= gridSize; i++) {
            const pos = i * cellSize;
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, size);
            ctx.moveTo(0, pos);
            ctx.lineTo(size, pos);
        }
        ctx.stroke();

        // Draw Schematic Lines
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;

        const numPaths = rng.nextInt(8, 13);

        for (let i = 0; i < numPaths; i++) {
            // Start point (snapped to grid center)
            let gx = rng.nextInt(0, gridSize);
            let gy = rng.nextInt(0, gridSize);

            let x = gx * cellSize + padding;
            let y = gy * cellSize + padding;

            ctx.beginPath();
            ctx.moveTo(x, y);

            // Draw a path with 1-3 segments
            const segments = rng.nextInt(1, 4);
            for (let j = 0; j < segments; j++) {
                const direction = rng.pick(['UP', 'DOWN', 'LEFT', 'RIGHT']);
                const length = rng.nextInt(1, 3); // Move 1 or 2 grid cells

                switch (direction) {
                    case 'UP': gy = Math.max(0, gy - length); break;
                    case 'DOWN': gy = Math.min(gridSize - 1, gy + length); break;
                    case 'LEFT': gx = Math.max(0, gx - length); break;
                    case 'RIGHT': gx = Math.min(gridSize - 1, gx + length); break;
                }

                x = gx * cellSize + padding;
                y = gy * cellSize + padding;
                ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Draw Terminator at the end
            const terminatorType = rng.pick(['CIRCLE', 'SQUARE', 'CROSS']);
            const tSize = 3;

            ctx.fillStyle = '#000';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;

            switch (terminatorType) {
                case 'CIRCLE':
                    ctx.beginPath();
                    ctx.arc(x, y, tSize, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'SQUARE':
                    ctx.beginPath();
                    ctx.rect(x - tSize, y - tSize, tSize * 2, tSize * 2);
                    ctx.stroke();
                    // Clear inside to make it look empty
                    ctx.fillStyle = '#fff';
                    ctx.fill();
                    ctx.stroke();
                    break;
                case 'CROSS':
                    ctx.beginPath();
                    ctx.moveTo(x - tSize, y - tSize);
                    ctx.lineTo(x + tSize, y + tSize);
                    ctx.moveTo(x + tSize, y - tSize);
                    ctx.lineTo(x - tSize, y + tSize);
                    ctx.stroke();
                    break;
            }
        }

    }, [seed, size]);

    return (
        <canvas
            ref={canvasRef}
            className={clsx("bg-white border border-black", className)}
        />
    );
};
