import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Grid3X3, ZoomIn, ZoomOut, Maximize2, User } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { AnimatedCircuitBackground } from '../landing/components/AnimatedCircuitBackground';

interface BookableItem {
    id: string;
    name: string;
    type: 'desk-1p' | 'desk-double' | 'desk-3p-round' | 'table-6p-share' | 'private-zone';
    status: 'available' | 'occupied' | 'reserved';
    gridPosition: { col: number; row: number; colSpan: number; rowSpan: number };
    lastBookedBy?: string;
    capacity?: number;
}

// Floor plan grid - complete coverage
const FLOOR_GRID_COLS = 14;
const FLOOR_GRID_ROWS = 8;

// Complete floor plan with all new desk types
const FLOOR_PLAN: BookableItem[] = [
    // === ROW 1 ===
    // Private Zone (4-6 people) - Top Left
    { id: 'PZ-1', name: 'Private Zone', type: 'private-zone', status: 'occupied', gridPosition: { col: 1, row: 1, colSpan: 3, rowSpan: 2 }, lastBookedBy: 'Team Alpha', capacity: 6 },
    
    // 3P Round Desks - Top Center
    { id: 'RD-1', name: '3P Round Desk', type: 'desk-3p-round', status: 'available', gridPosition: { col: 4, row: 1, colSpan: 2, rowSpan: 2 }, capacity: 3 },
    { id: 'RD-2', name: '3P Round Desk', type: 'desk-3p-round', status: 'reserved', gridPosition: { col: 6, row: 1, colSpan: 2, rowSpan: 2 }, lastBookedBy: 'Creative Team', capacity: 3 },
    
    // 6P Work Table Share - Top Right
    { id: 'WT-1', name: '6P Work Table', type: 'table-6p-share', status: 'available', gridPosition: { col: 8, row: 1, colSpan: 3, rowSpan: 2 }, capacity: 6 },
    
    // Single Desks - Top Right Corner
    { id: 'SD-1', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 11, row: 1, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'SD-2', name: '1P Desk', type: 'desk-1p', status: 'occupied', gridPosition: { col: 12, row: 1, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Maria S.', capacity: 1 },
    { id: 'DD-1', name: 'Double Desk', type: 'desk-double', status: 'available', gridPosition: { col: 13, row: 1, colSpan: 2, rowSpan: 1 }, capacity: 2 },
    
    // === ROW 2 ===
    { id: 'SD-3', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 11, row: 2, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'SD-4', name: '1P Desk', type: 'desk-1p', status: 'reserved', gridPosition: { col: 12, row: 2, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Tom K.', capacity: 1 },
    { id: 'DD-2', name: 'Double Desk', type: 'desk-double', status: 'occupied', gridPosition: { col: 13, row: 2, colSpan: 2, rowSpan: 1 }, lastBookedBy: 'Pair Program', capacity: 2 },
    
    // === ROW 3 ===
    // Single Desks - Left side
    { id: 'SD-5', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 1, row: 3, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'SD-6', name: '1P Desk', type: 'desk-1p', status: 'occupied', gridPosition: { col: 2, row: 3, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Alex B.', capacity: 1 },
    { id: 'SD-7', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 3, row: 3, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    
    // Private Zone - Center
    { id: 'PZ-2', name: 'Private Zone', type: 'private-zone', status: 'available', gridPosition: { col: 4, row: 3, colSpan: 3, rowSpan: 2 }, capacity: 5 },
    
    // 6P Work Table Share
    { id: 'WT-2', name: '6P Work Table', type: 'table-6p-share', status: 'reserved', gridPosition: { col: 7, row: 3, colSpan: 3, rowSpan: 2 }, lastBookedBy: 'Project X', capacity: 6 },
    
    // 3P Round Desk
    { id: 'RD-3', name: '3P Round Desk', type: 'desk-3p-round', status: 'occupied', gridPosition: { col: 10, row: 3, colSpan: 2, rowSpan: 2 }, lastBookedBy: 'Squad B', capacity: 3 },
    
    // Double Desks
    { id: 'DD-3', name: 'Double Desk', type: 'desk-double', status: 'available', gridPosition: { col: 12, row: 3, colSpan: 2, rowSpan: 1 }, capacity: 2 },
    { id: 'DD-4', name: 'Double Desk', type: 'desk-double', status: 'available', gridPosition: { col: 14, row: 3, colSpan: 1, rowSpan: 1 }, capacity: 2 },
    
    // === ROW 4 ===
    { id: 'SD-8', name: '1P Desk', type: 'desk-1p', status: 'reserved', gridPosition: { col: 1, row: 4, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Chris L.', capacity: 1 },
    { id: 'SD-9', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 2, row: 4, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'SD-10', name: '1P Desk', type: 'desk-1p', status: 'occupied', gridPosition: { col: 3, row: 4, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Nina W.', capacity: 1 },
    
    { id: 'DD-5', name: 'Double Desk', type: 'desk-double', status: 'available', gridPosition: { col: 12, row: 4, colSpan: 2, rowSpan: 1 }, capacity: 2 },
    { id: 'SD-11', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 14, row: 4, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    
    // === ROW 5 ===
    // Double Desks - Left
    { id: 'DD-6', name: 'Double Desk', type: 'desk-double', status: 'available', gridPosition: { col: 1, row: 5, colSpan: 2, rowSpan: 1 }, capacity: 2 },
    
    // 3P Round Desk
    { id: 'RD-4', name: '3P Round Desk', type: 'desk-3p-round', status: 'available', gridPosition: { col: 3, row: 5, colSpan: 2, rowSpan: 2 }, capacity: 3 },
    
    // Private Zone
    { id: 'PZ-3', name: 'Private Zone', type: 'private-zone', status: 'reserved', gridPosition: { col: 5, row: 5, colSpan: 3, rowSpan: 2 }, lastBookedBy: 'Team Beta', capacity: 4 },
    
    // 6P Work Table Share
    { id: 'WT-3', name: '6P Work Table', type: 'table-6p-share', status: 'available', gridPosition: { col: 8, row: 5, colSpan: 3, rowSpan: 2 }, capacity: 6 },
    
    // Single Desks - Right
    { id: 'SD-12', name: '1P Desk', type: 'desk-1p', status: 'occupied', gridPosition: { col: 11, row: 5, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Max F.', capacity: 1 },
    { id: 'SD-13', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 12, row: 5, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DD-7', name: 'Double Desk', type: 'desk-double', status: 'available', gridPosition: { col: 13, row: 5, colSpan: 2, rowSpan: 1 }, capacity: 2 },
    
    // === ROW 6 ===
    { id: 'DD-8', name: 'Double Desk', type: 'desk-double', status: 'occupied', gridPosition: { col: 1, row: 6, colSpan: 2, rowSpan: 1 }, lastBookedBy: 'Study Pair', capacity: 2 },
    
    { id: 'SD-14', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 11, row: 6, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'SD-15', name: '1P Desk', type: 'desk-1p', status: 'reserved', gridPosition: { col: 12, row: 6, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Sara K.', capacity: 1 },
    { id: 'DD-9', name: 'Double Desk', type: 'desk-double', status: 'available', gridPosition: { col: 13, row: 6, colSpan: 2, rowSpan: 1 }, capacity: 2 },
    
    // === ROW 7 ===
    // Single Desks
    { id: 'SD-16', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 1, row: 7, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'SD-17', name: '1P Desk', type: 'desk-1p', status: 'occupied', gridPosition: { col: 2, row: 7, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Emma J.', capacity: 1 },
    
    // 3P Round Desk
    { id: 'RD-5', name: '3P Round Desk', type: 'desk-3p-round', status: 'available', gridPosition: { col: 3, row: 7, colSpan: 2, rowSpan: 2 }, capacity: 3 },
    
    // 6P Work Table Share
    { id: 'WT-4', name: '6P Work Table', type: 'table-6p-share', status: 'occupied', gridPosition: { col: 5, row: 7, colSpan: 3, rowSpan: 2 }, lastBookedBy: 'Design Team', capacity: 6 },
    
    // Private Zone
    { id: 'PZ-4', name: 'Private Zone', type: 'private-zone', status: 'available', gridPosition: { col: 8, row: 7, colSpan: 3, rowSpan: 2 }, capacity: 6 },
    
    // Double Desks
    { id: 'DD-10', name: 'Double Desk', type: 'desk-double', status: 'available', gridPosition: { col: 11, row: 7, colSpan: 2, rowSpan: 1 }, capacity: 2 },
    { id: 'SD-18', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 13, row: 7, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'SD-19', name: '1P Desk', type: 'desk-1p', status: 'occupied', gridPosition: { col: 14, row: 7, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Julia H.', capacity: 1 },
    
    // === ROW 8 ===
    { id: 'SD-20', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 1, row: 8, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'SD-21', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 2, row: 8, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    
    { id: 'DD-11', name: 'Double Desk', type: 'desk-double', status: 'reserved', gridPosition: { col: 11, row: 8, colSpan: 2, rowSpan: 1 }, lastBookedBy: 'Team C', capacity: 2 },
    { id: 'SD-22', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 13, row: 8, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'SD-23', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 14, row: 8, colSpan: 1, rowSpan: 1 }, capacity: 1 },
];

const STATUS_STYLES = {
    available: {
        bg: 'bg-white/70',
        border: 'border-black',
        text: 'text-black',
        badge: 'bg-green-50 border-green-200 text-green-700',
    },
    occupied: {
        bg: 'bg-gray-200/80',
        border: 'border-gray-500',
        text: 'text-gray-600',
        badge: 'bg-red-50 border-red-200 text-red-600',
    },
    reserved: {
        bg: 'bg-amber-100/80',
        border: 'border-amber-500',
        text: 'text-amber-800',
        badge: 'bg-amber-50 border-amber-300 text-amber-700',
    },
};

const TYPE_STYLES: Record<BookableItem['type'], { icon: string; color: string }> = {
    'desk-1p': { icon: '▫', color: 'bg-blue-50/60 border-blue-300' },
    'desk-double': { icon: '▬', color: 'bg-green-50/60 border-green-300' },
    'desk-3p-round': { icon: '●', color: 'bg-purple-50/60 border-purple-300' },
    'table-6p-share': { icon: '▭', color: 'bg-amber-50/60 border-amber-400' },
    'private-zone': { icon: '▣', color: 'bg-cyan-50/60 border-cyan-400' },
};

export const BookingPage = () => {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);

    const selectedZone = FLOOR_PLAN.find(i => i.id === selectedItem);

    const stats = {
        total: FLOOR_PLAN.length,
        available: FLOOR_PLAN.filter(i => i.status === 'available').length,
        occupied: FLOOR_PLAN.filter(i => i.status === 'occupied').length,
        reserved: FLOOR_PLAN.filter(i => i.status === 'reserved').length,
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <AnimatedCircuitBackground />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Link 
                            to="/profile" 
                            className="p-2 bg-white border border-gray-200 rounded-md hover:border-black transition-colors group"
                        >
                            <Home className="w-5 h-5 text-gray-500 group-hover:text-black" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Workspace Booking</h1>
                            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                                Desk & Zone Booking • Full Coverage
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-2">
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" onClick={() => setZoom(1)} className="p-2">
                            <Maximize2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" onClick={() => setZoom(Math.min(1.5, zoom + 0.25))} className="p-2">
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Legend */}
                <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3 mb-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono uppercase">
                        <div className="flex items-center gap-2">
                            <Grid3X3 className="w-4 h-4" />
                            <span className="font-semibold">{stats.total} Zones</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300" />
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-white border-2 border-black" />
                            <span>Available ({stats.available})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-gray-100 border-2 border-gray-400" />
                            <span>Occupied ({stats.occupied})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-amber-50 border-2 border-amber-400" />
                            <span>Reserved ({stats.reserved})</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300" />
                        <span>▫ 1P Desk</span>
                        <span>▬ Double</span>
                        <span>● 3P Round</span>
                        <span>▭ 6P Table</span>
                        <span>▣ Private</span>
                    </div>
                </div>

                {/* Main Floor Map */}
                <div className="bg-white border border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 mb-4 overflow-auto">
                    <div 
                        className="relative rounded border-2 border-gray-300"
                        style={{
                            backgroundImage: `url('/floor-plan.png')`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                        }}
                    >
                        {/* Floor Plan Grid */}
                        <div 
                            className="grid gap-1 p-2 transition-transform duration-200"
                            style={{
                                gridTemplateColumns: `repeat(${FLOOR_GRID_COLS}, minmax(60px, 1fr))`,
                                gridTemplateRows: `repeat(${FLOOR_GRID_ROWS}, minmax(55px, 1fr))`,
                                transform: `scale(${zoom})`,
                                transformOrigin: 'top left',
                            }}
                        >
                            {FLOOR_PLAN.map((item) => {
                                const statusStyles = STATUS_STYLES[item.status];
                                const typeStyle = TYPE_STYLES[item.type];
                                const isSelected = selectedItem === item.id;
                                const isClickable = item.status === 'available';

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => isClickable && setSelectedItem(isSelected ? null : item.id)}
                                        className={`
                                            relative p-1.5 border-2 transition-all duration-150 overflow-hidden rounded-sm backdrop-blur-sm
                                            ${statusStyles.bg} ${statusStyles.border} ${statusStyles.text}
                                            ${typeStyle.color && item.status === 'available' ? typeStyle.color : ''}
                                            ${isClickable ? 'cursor-pointer hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:backdrop-blur-md hover:bg-opacity-90' : ''}
                                            ${isSelected ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5 border-black z-10 backdrop-blur-md' : 'shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'}
                                        `}
                                        style={{
                                            gridColumn: `${item.gridPosition.col} / span ${item.gridPosition.colSpan}`,
                                            gridRow: `${item.gridPosition.row} / span ${item.gridPosition.rowSpan}`,
                                        }}
                                    >
                                        {/* Type Icon */}
                                        <span className="absolute top-0.5 left-1 text-xs opacity-40">
                                            {typeStyle.icon}
                                        </span>

                                        {/* ID Badge */}
                                        <span className="absolute top-0.5 right-1 font-mono text-[7px] opacity-30">
                                            {item.id}
                                        </span>

                                        {/* Content */}
                                        <div className="flex flex-col h-full justify-between pt-3">
                                            <p className="font-mono text-[8px] uppercase tracking-wider font-bold leading-tight">
                                                {item.name}
                                            </p>

                                            {/* Capacity */}
                                            {item.capacity !== undefined && item.capacity > 0 && (
                                                <span className="font-mono text-[7px] opacity-50">
                                                    {item.capacity}p
                                                </span>
                                            )}

                                            {/* Responsible Person */}
                                            {item.lastBookedBy && (
                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                    <User className="w-2 h-2 opacity-50" />
                                                    <span className="font-mono text-[7px] uppercase opacity-70 truncate">
                                                        {item.lastBookedBy}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Status Badge */}
                                            <span className={`
                                                inline-block px-1 py-0.5 text-[6px] font-mono uppercase mt-auto
                                                border ${statusStyles.badge} rounded-sm
                                            `}>
                                                {item.status}
                                            </span>
                                        </div>

                                        {/* Selection Indicator */}
                                        {isSelected && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-black rounded-full flex items-center justify-center">
                                                <span className="text-white text-[8px]">✓</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Selected Item Details */}
                {selectedZone && (
                    <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-mono text-xs uppercase tracking-wider text-gray-500">
                                    {selectedZone.id} • {selectedZone.type} • Capacity: {selectedZone.capacity || 'N/A'}
                                </p>
                                <p className="font-bold text-lg mt-1">{selectedZone.name}</p>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                                    Cancel
                                </Button>
                                <Button className="bg-black text-white hover:bg-gray-800">
                                    Book This Zone
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white border border-gray-200 p-3">
                        <p className="text-[10px] font-mono text-gray-500 uppercase">Total</p>
                        <p className="text-xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-3">
                        <p className="text-[10px] font-mono text-gray-500 uppercase">Available</p>
                        <p className="text-xl font-bold text-green-600">{stats.available}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-3">
                        <p className="text-[10px] font-mono text-gray-500 uppercase">Occupied</p>
                        <p className="text-xl font-bold text-red-600">{stats.occupied}</p>
                    </div>
                    <div className="bg-white border border-gray-200 p-3">
                        <p className="text-[10px] font-mono text-gray-500 uppercase">Reserved</p>
                        <p className="text-xl font-bold text-amber-600">{stats.reserved}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
