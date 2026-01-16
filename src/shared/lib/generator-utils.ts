/**
 * Converts a string to a numeric seed using a simple hashing algorithm (djb2).
 */
export function stringToSeed(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return hash >>> 0; // Ensure positive integer
}

/**
 * A Linear Congruential Generator (LCG) for seeded random numbers.
 */
export class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
     */
    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    /**
     * Returns a pseudo-random integer between min (inclusive) and max (exclusive).
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min)) + min;
    }

    /**
     * Returns a random item from an array.
     */
    pick<T>(array: T[]): T {
        return array[this.nextInt(0, array.length)];
    }
}
