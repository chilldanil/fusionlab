import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Grid3X3, ZoomIn, ZoomOut, Maximize2, User } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { AnimatedCircuitBackground } from '../landing/components/AnimatedCircuitBackground';

interface BookableItem {
    id: string;
    name: string;
    type: 'conference' | 'nook' | 'desk' | 'table-4p' | 'workbench-6p' | 'workshop' | 'printing' | 'kitchen';
    status: 'available' | 'occupied' | 'reserved';
    gridPosition: { col: number; row: number; colSpan: number; rowSpan: number };
    lastBookedBy?: string;
    capacity?: number;
}

// Floor plan grid based on architectural drawing
// Approximately 14 columns x 8 rows to match the layout
const FLOOR_GRID_COLS = 14;
const FLOOR_GRID_ROWS = 8;

// Mapping the TUM Makerspace floor plan
const FLOOR_PLAN: BookableItem[] = [
    // === CONFERENCE HALL (Top-left, large room) ===
    { id: 'CONF-1', name: 'Conference Hall', type: 'conference', status: 'available', gridPosition: { col: 1, row: 1, colSpan: 3, rowSpan: 3 }, capacity: 14 },

    // === SINGLE CORNER NOOKS - Top Left (near conference) ===
    { id: 'NOOK-TL1', name: 'Corner Nook', type: 'nook', status: 'available', gridPosition: { col: 4, row: 1, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'NOOK-TL2', name: 'Corner Nook', type: 'nook', status: 'occupied', gridPosition: { col: 4, row: 2, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Maria S.', capacity: 1 },

    // === SINGLE DESKS - Top Row (6 desks) ===
    { id: 'DESK-T1', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 5, row: 1, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-T2', name: 'Single Desk', type: 'desk', status: 'occupied', gridPosition: { col: 6, row: 1, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Tom K.', capacity: 1 },
    { id: 'DESK-T3', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 7, row: 1, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-T4', name: 'Single Desk', type: 'desk', status: 'reserved', gridPosition: { col: 8, row: 1, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Team A', capacity: 1 },
    { id: 'DESK-T5', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 9, row: 1, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-T6', name: 'Single Desk', type: 'desk', status: 'occupied', gridPosition: { col: 10, row: 1, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Lisa M.', capacity: 1 },

    // === SINGLE CORNER NOOKS - Top Right ===
    { id: 'NOOK-TR1', name: 'Corner Nook', type: 'nook', status: 'available', gridPosition: { col: 11, row: 1, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'NOOK-TR2', name: 'Corner Nook', type: 'nook', status: 'reserved', gridPosition: { col: 12, row: 1, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Jan P.', capacity: 1 },

    // === WORKSHOP AREA (Right strip) ===
    { id: 'WORK-1', name: 'Workshop Area', type: 'workshop', status: 'occupied', gridPosition: { col: 13, row: 1, colSpan: 2, rowSpan: 6 }, lastBookedBy: 'Workshop Team', capacity: 8 },

    // === 4-PERSON TABLES - Left side ===
    { id: 'TBL4-L1', name: '4-Person Table', type: 'table-4p', status: 'available', gridPosition: { col: 1, row: 4, colSpan: 2, rowSpan: 1 }, capacity: 4 },
    { id: 'TBL4-L2', name: '4-Person Table', type: 'table-4p', status: 'occupied', gridPosition: { col: 1, row: 5, colSpan: 2, rowSpan: 1 }, lastBookedBy: 'Study Group', capacity: 4 },

    // === SINGLE DESKS - Middle Area Row 2 (6 desks) ===
    { id: 'DESK-M1', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 5, row: 2, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-M2', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 6, row: 2, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-M3', name: 'Single Desk', type: 'desk', status: 'occupied', gridPosition: { col: 7, row: 2, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Alex B.', capacity: 1 },
    { id: 'DESK-M4', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 8, row: 2, colSpan: 1, rowSpan: 1 }, capacity: 1 },

    // === 6-PERSON WORKBENCHES - Right side ===
    { id: 'WB6-1', name: '6P Workbench', type: 'workbench-6p', status: 'reserved', gridPosition: { col: 9, row: 2, colSpan: 2, rowSpan: 2 }, lastBookedBy: 'Project X', capacity: 6 },
    { id: 'WB6-2', name: '6P Workbench', type: 'workbench-6p', status: 'available', gridPosition: { col: 11, row: 2, colSpan: 2, rowSpan: 2 }, capacity: 6 },

    // === SINGLE DESKS - Middle Area Row 3-4 ===
    { id: 'DESK-M5', name: 'Single Desk', type: 'desk', status: 'reserved', gridPosition: { col: 3, row: 3, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Chris L.', capacity: 1 },
    { id: 'DESK-M6', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 4, row: 3, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-M7', name: 'Single Desk', type: 'desk', status: 'occupied', gridPosition: { col: 5, row: 3, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Nina W.', capacity: 1 },
    { id: 'DESK-M8', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 6, row: 3, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-M9', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 7, row: 3, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-M10', name: 'Single Desk', type: 'desk', status: 'occupied', gridPosition: { col: 8, row: 3, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Max F.', capacity: 1 },

    { id: 'DESK-M11', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 3, row: 4, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-M12', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 4, row: 4, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-M13', name: 'Single Desk', type: 'desk', status: 'reserved', gridPosition: { col: 5, row: 4, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Sara K.', capacity: 1 },
    { id: 'DESK-M14', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 6, row: 4, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-M15', name: 'Single Desk', type: 'desk', status: 'occupied', gridPosition: { col: 7, row: 4, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Paul R.', capacity: 1 },
    { id: 'DESK-M16', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 8, row: 4, colSpan: 1, rowSpan: 1 }, capacity: 1 },

    // === 6-PERSON WORKBENCHES - Lower right ===
    { id: 'WB6-3', name: '6P Workbench', type: 'workbench-6p', status: 'occupied', gridPosition: { col: 9, row: 4, colSpan: 2, rowSpan: 2 }, lastBookedBy: 'Design Team', capacity: 6 },
    { id: 'WB6-4', name: '6P Workbench', type: 'workbench-6p', status: 'available', gridPosition: { col: 11, row: 4, colSpan: 2, rowSpan: 2 }, capacity: 6 },

    // === SINGLE CORNER NOOKS - Bottom Left ===
    { id: 'NOOK-BL1', name: 'Corner Nook', type: 'nook', status: 'available', gridPosition: { col: 1, row: 6, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'NOOK-BL2', name: 'Corner Nook', type: 'nook', status: 'occupied', gridPosition: { col: 2, row: 6, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Emma J.', capacity: 1 },

    // === 4-PERSON TABLES - Bottom Center ===
    { id: 'TBL4-B1', name: '4-Person Table', type: 'table-4p', status: 'available', gridPosition: { col: 3, row: 5, colSpan: 2, rowSpan: 1 }, capacity: 4 },
    { id: 'TBL4-B2', name: '4-Person Table', type: 'table-4p', status: 'reserved', gridPosition: { col: 5, row: 5, colSpan: 2, rowSpan: 1 }, lastBookedBy: 'Team B', capacity: 4 },

    // === SINGLE DESKS - Bottom Row ===
    { id: 'DESK-B1', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 3, row: 6, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-B2', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 4, row: 6, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'DESK-B3', name: 'Single Desk', type: 'desk', status: 'occupied', gridPosition: { col: 5, row: 6, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Mike T.', capacity: 1 },
    { id: 'DESK-B4', name: 'Single Desk', type: 'desk', status: 'available', gridPosition: { col: 6, row: 6, colSpan: 1, rowSpan: 1 }, capacity: 1 },

    // === 3D PRINTING ZONE ===
    { id: '3DPRINT', name: '3D Printing Zone', type: 'printing', status: 'available', gridPosition: { col: 7, row: 5, colSpan: 2, rowSpan: 2 }, capacity: 4 },

    // === KITCHENETTE/CAFE ===
    { id: 'KITCHEN', name: 'Kitchenette/Cafe', type: 'kitchen', status: 'occupied', gridPosition: { col: 9, row: 6, colSpan: 2, rowSpan: 2 }, lastBookedBy: 'Everyone', capacity: 6 },

    // === SINGLE CORNER NOOKS - Bottom Right ===
    { id: 'NOOK-BR1', name: 'Corner Nook', type: 'nook', status: 'available', gridPosition: { col: 11, row: 6, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'NOOK-BR2', name: 'Corner Nook', type: 'nook', status: 'reserved', gridPosition: { col: 12, row: 6, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Focus Time', capacity: 1 },

    // === Bottom edge zones ===
    { id: 'NOOK-BL3', name: 'Corner Nook', type: 'nook', status: 'available', gridPosition: { col: 1, row: 7, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'NOOK-BL4', name: 'Corner Nook', type: 'nook', status: 'available', gridPosition: { col: 2, row: 7, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'TBL4-B3', name: '4-Person Table', type: 'table-4p', status: 'occupied', gridPosition: { col: 3, row: 7, colSpan: 2, rowSpan: 1 }, lastBookedBy: 'Lunch Group', capacity: 4 },
    { id: 'TBL4-B4', name: '4-Person Table', type: 'table-4p', status: 'available', gridPosition: { col: 5, row: 7, colSpan: 2, rowSpan: 1 }, capacity: 4 },

    // === South Wall Nooks ===
    { id: 'NOOK-BR3', name: 'Corner Nook', type: 'nook', status: 'occupied', gridPosition: { col: 11, row: 7, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Julia H.', capacity: 1 },
    { id: 'NOOK-BR4', name: 'Corner Nook', type: 'nook', status: 'available', gridPosition: { col: 12, row: 7, colSpan: 1, rowSpan: 1 }, capacity: 1 },

    // === Fill remaining bottom row ===
    { id: 'ENTRY', name: 'Entry Area', type: 'nook', status: 'available', gridPosition: { col: 13, row: 7, colSpan: 2, rowSpan: 1 }, capacity: 0 },

    // === Hallway/passage areas to fill gaps ===
    { id: 'PASS-1', name: 'Passage', type: 'nook', status: 'available', gridPosition: { col: 1, row: 8, colSpan: 3, rowSpan: 1 } },
    { id: 'PASS-2', name: 'Passage', type: 'nook', status: 'available', gridPosition: { col: 4, row: 8, colSpan: 3, rowSpan: 1 } },
    { id: 'PASS-3', name: 'Passage', type: 'nook', status: 'available', gridPosition: { col: 7, row: 8, colSpan: 2, rowSpan: 1 } },
    { id: 'PASS-4', name: 'Passage', type: 'nook', status: 'available', gridPosition: { col: 9, row: 8, colSpan: 3, rowSpan: 1 } },
    { id: 'EXIT', name: 'Exit', type: 'nook', status: 'available', gridPosition: { col: 12, row: 8, colSpan: 3, rowSpan: 1 } },
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
    conference: { icon: '▣', color: 'bg-blue-100/60 border-blue-400' },
    nook: { icon: '●', color: 'bg-orange-100/60 border-orange-400' },
    desk: { icon: '▫', color: '' },
    'table-4p': { icon: '▬', color: 'bg-yellow-100/60 border-yellow-400' },
    'workbench-6p': { icon: '▭', color: 'bg-purple-100/60 border-purple-400' },
    workshop: { icon: '⚙', color: 'bg-slate-200/70 border-slate-500' },
    printing: { icon: '▣', color: 'bg-cyan-100/60 border-cyan-400' },
    kitchen: { icon: '☕', color: 'bg-rose-100/60 border-rose-400' },
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
                            <h1 className="text-2xl font-bold tracking-tight">TUM Makerspace</h1>
                            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                                Floor Plan Booking • 100% Coverage
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
                        <span>▣ Conf</span>
                        <span>● Nook</span>
                        <span>▫ Desk</span>
                        <span>▬ 4P Table</span>
                        <span>▭ 6P Bench</span>
                        <span>⚙ Workshop</span>
                        <span>☕ Kitchen</span>
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
