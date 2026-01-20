export const ANIMATION_CONFIG = {
  cityOpener: {
    flightSpeed: 0.2,
    accelerationTime: 0.6,
    decelerationTime: 0.4,
    cloudFadeEnd: 0.35,
    mapRevealStart: 0.1,
    mapScaleStart: 0.85,
    mapScaleEnd: 3,
    transitionFadeStart: 0.88,
    transitionComplete: 0.98,
  },
  circuitBackground: {
    pulseInterval: 600,
    maxPulses: 80,
    collisionInterval: 200,
    collisionCleanupInterval: 1000,
    collisionTtl: 1000,
  },
} as const;
