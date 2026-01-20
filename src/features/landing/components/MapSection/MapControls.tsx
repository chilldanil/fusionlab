import type { Map } from 'mapbox-gl';

interface MapControlsProps {
  map: Map | null;
  onReset: () => void;
}

export const MapControls = ({ map, onReset }: MapControlsProps) => {
  return (
    <div className="absolute top-20 md:top-24 right-4 md:right-6 z-30 flex flex-col gap-0">
      <button
        onClick={() => map?.zoomIn({ duration: 400 })}
        className="w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-black flex items-center justify-center hover:bg-black transition-all group"
        aria-label="Zoom in on map"
      >
        <svg
          className="w-4 h-4 md:w-5 md:h-5 text-black group-hover:text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        onClick={() => map?.zoomOut({ duration: 400 })}
        className="w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-black border-t-0 flex items-center justify-center hover:bg-black transition-all group"
        aria-label="Zoom out on map"
      >
        <svg
          className="w-4 h-4 md:w-5 md:h-5 text-black group-hover:text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div className="h-2" />

      <button
        onClick={onReset}
        className="w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-black flex items-center justify-center hover:bg-black transition-all group"
        aria-label="Reset map view"
      >
        <svg
          className="w-4 h-4 md:w-5 md:h-5 text-black group-hover:text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  );
};
