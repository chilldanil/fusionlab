import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, Grid3X3, ZoomIn, ZoomOut, Maximize2, User, List, LayoutGrid } from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import { AnimatedCircuitBackground } from '../landing/components/AnimatedCircuitBackground';
import { useAuth } from '../../shared/context/AuthContext';
import { SocialService, type ProfileSummary } from '../social/SocialService';
import { BookingService, type BookingRecord } from './services/BookingService';
import { supabase } from '../../shared/config/supabase';

type BookingStatus = 'available' | 'occupied' | 'reserved' | 'pending';

interface Seat {
    id: string;
    label: string;
    status: BookingStatus;
    lastBookedBy?: string;
}

interface BookableItem {
    id: string;
    name: string;
    type: 'desk-1p' | 'desk-double' | 'desk-3p-round' | 'table-6p-share' | 'private-zone';
    status: BookingStatus;
    gridPosition: { col: number; row: number; colSpan: number; rowSpan: number };
    lastBookedBy?: string;
    capacity?: number;
    seats?: Seat[];
    minInviteCount?: number;
}

// Floor plan grid - complete coverage
const FLOOR_GRID_COLS = 14;
const FLOOR_GRID_ROWS = 8;

const TIME_SLOTS = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00',
];

const getTodayDate = () => new Date().toISOString().split('T')[0];

const SEAT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const buildSeats = (
    zoneId: string,
    capacity: number,
    statuses: BookingStatus[],
    bookedBy: Array<string | undefined> = [],
) => {
    return Array.from({ length: capacity }, (_, index) => ({
        id: `${zoneId}-${SEAT_LABELS[index] || String(index + 1)}`,
        label: SEAT_LABELS[index] || String(index + 1),
        status: statuses[index] ?? 'available',
        lastBookedBy: bookedBy[index],
    }));
};

type ZoneSeed = BookableItem & {
    seatStatuses?: BookingStatus[];
    seatBookedBy?: Array<string | undefined>;
};

// Complete floor plan with all new desk types
const FLOOR_PLAN_SEED: ZoneSeed[] = [
    // === ROW 1 ===
    // Private Zone (4-6 people) - Top Left
    { id: 'PZ-1', name: 'Private Zone', type: 'private-zone', status: 'occupied', gridPosition: { col: 1, row: 1, colSpan: 3, rowSpan: 2 }, lastBookedBy: 'Team Alpha', capacity: 6, minInviteCount: 3 },
    
    // 3P Round Desks - Top Center
    { id: 'RD-1', name: '3P Round Desk', type: 'desk-3p-round', status: 'available', gridPosition: { col: 4, row: 1, colSpan: 2, rowSpan: 2 }, capacity: 3, seatStatuses: ['available', 'occupied', 'available'], seatBookedBy: [undefined, 'Lena P.', undefined] },
    { id: 'RD-2', name: '3P Round Desk', type: 'desk-3p-round', status: 'reserved', gridPosition: { col: 6, row: 1, colSpan: 2, rowSpan: 2 }, lastBookedBy: 'Creative Team', capacity: 3 },
    
    // 6P Work Table Share - Top Right
    { id: 'WT-1', name: '6P Work Table', type: 'table-6p-share', status: 'available', gridPosition: { col: 8, row: 1, colSpan: 3, rowSpan: 2 }, capacity: 6, seatStatuses: ['available', 'occupied', 'available', 'reserved', 'available', 'available'], seatBookedBy: [undefined, 'Sam R.', undefined, 'Research Team', undefined, undefined] },
    
    // Single Desks - Top Right Corner
    { id: 'SD-1', name: '1P Desk', type: 'desk-1p', status: 'available', gridPosition: { col: 11, row: 1, colSpan: 1, rowSpan: 1 }, capacity: 1 },
    { id: 'SD-2', name: '1P Desk', type: 'desk-1p', status: 'occupied', gridPosition: { col: 12, row: 1, colSpan: 1, rowSpan: 1 }, lastBookedBy: 'Maria S.', capacity: 1 },
    { id: 'DD-1', name: 'Double Desk', type: 'desk-double', status: 'available', gridPosition: { col: 13, row: 1, colSpan: 2, rowSpan: 1 }, capacity: 2, seatStatuses: ['available', 'occupied'], seatBookedBy: [undefined, 'Marco D.'] },
    
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
    { id: 'PZ-2', name: 'Private Zone', type: 'private-zone', status: 'available', gridPosition: { col: 4, row: 3, colSpan: 3, rowSpan: 2 }, capacity: 5, minInviteCount: 3 },
    
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
    { id: 'RD-4', name: '3P Round Desk', type: 'desk-3p-round', status: 'available', gridPosition: { col: 3, row: 5, colSpan: 2, rowSpan: 2 }, capacity: 3, seatStatuses: ['occupied', 'available', 'available'], seatBookedBy: ['Nora Q.', undefined, undefined] },
    
    // Private Zone
    { id: 'PZ-3', name: 'Private Zone', type: 'private-zone', status: 'reserved', gridPosition: { col: 5, row: 5, colSpan: 3, rowSpan: 2 }, lastBookedBy: 'Team Beta', capacity: 4, minInviteCount: 3 },
    
    // 6P Work Table Share
    { id: 'WT-3', name: '6P Work Table', type: 'table-6p-share', status: 'available', gridPosition: { col: 8, row: 5, colSpan: 3, rowSpan: 2 }, capacity: 6, seatStatuses: ['available', 'available', 'occupied', 'available', 'reserved', 'available'], seatBookedBy: [undefined, undefined, 'Jonas T.', undefined, 'ML Team', undefined] },
    
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
    { id: 'WT-4', name: '6P Work Table', type: 'table-6p-share', status: 'occupied', gridPosition: { col: 5, row: 7, colSpan: 3, rowSpan: 2 }, lastBookedBy: 'Design Team', capacity: 6, seatStatuses: ['occupied', 'occupied', 'occupied', 'occupied', 'occupied', 'occupied'], seatBookedBy: ['A. Kim', 'B. Lee', 'C. Park', 'D. Chen', 'E. Ivan', 'F. Rossi'] },
    
    // Private Zone
    { id: 'PZ-4', name: 'Private Zone', type: 'private-zone', status: 'available', gridPosition: { col: 8, row: 7, colSpan: 3, rowSpan: 2 }, capacity: 6, minInviteCount: 3 },
    
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

const FLOOR_PLAN: BookableItem[] = FLOOR_PLAN_SEED.map((zone) => {
    if (zone.type === 'private-zone') {
        return zone;
    }

    const capacity = zone.capacity ?? 1;
    const statuses = zone.seatStatuses ?? Array.from({ length: capacity }, () => zone.status);
    const seats = buildSeats(zone.id, capacity, statuses, zone.seatBookedBy);
    const { seatStatuses, seatBookedBy, ...baseZone } = zone;

    return { ...baseZone, seats };
});

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
    pending: {
        bg: 'bg-indigo-100/70',
        border: 'border-indigo-500',
        text: 'text-indigo-800',
        badge: 'bg-indigo-50 border-indigo-300 text-indigo-700',
    },
};

const TYPE_STYLES: Record<BookableItem['type'], { icon: string; color: string }> = {
    'desk-1p': { icon: '▫', color: 'bg-blue-50/60 border-blue-300' },
    'desk-double': { icon: '▬', color: 'bg-green-50/60 border-green-300' },
    'desk-3p-round': { icon: '●', color: 'bg-purple-50/60 border-purple-300' },
    'table-6p-share': { icon: '▭', color: 'bg-amber-50/60 border-amber-400' },
    'private-zone': { icon: '▣', color: 'bg-cyan-50/60 border-cyan-400' },
};

const TYPE_LABELS: Record<BookableItem['type'], string> = {
    'desk-1p': '1P Desk',
    'desk-double': 'Double Desk',
    'desk-3p-round': '3P Round Desk',
    'table-6p-share': '6P Work Table',
    'private-zone': 'Private Zone',
};

export const BookingPage = () => {
    const { user } = useAuth();
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [invitedFriendIds, setInvitedFriendIds] = useState<string[]>([]);
    const [friends, setFriends] = useState<ProfileSummary[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [friendsError, setFriendsError] = useState<string | null>(null);
    const [activeSlot, setActiveSlot] = useState(TIME_SLOTS[0]);
    const [activeDate, setActiveDate] = useState(getTodayDate());
    const [bookings, setBookings] = useState<BookingRecord[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [bookingsError, setBookingsError] = useState<string | null>(null);
    const [bookingActionError, setBookingActionError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingInviteCount, setPendingInviteCount] = useState(0);

    const zones = useMemo<BookableItem[]>(() => {
        const seatBookings = new Map<string, BookingRecord>();
        const zoneBookings = new Map<string, BookingRecord>();

        const toUiStatus = (status: BookingRecord['status']): BookingStatus => {
            if (status === 'confirmed') return 'occupied';
            if (status === 'cancelled') return 'available';
            return status;
        };

        bookings.forEach((booking) => {
            if (booking.seat_id) {
                seatBookings.set(booking.seat_id, booking);
            } else {
                zoneBookings.set(booking.zone_id, booking);
            }
        });

        return FLOOR_PLAN.map((zone) => {
            if (zone.type === 'private-zone') {
                const zoneBooking = zoneBookings.get(zone.id);
                return zoneBooking
                    ? { ...zone, status: toUiStatus(zoneBooking.status) }
                    : { ...zone, status: 'available' as BookingStatus };
            }

            if (!zone.seats?.length) {
                return zone;
            }

            const seats = zone.seats.map((seat) => {
                const booking = seatBookings.get(seat.id);
                if (!booking) {
                    return { ...seat, status: 'available' as BookingStatus, lastBookedBy: undefined };
                }
                return {
                    ...seat,
                    status: toUiStatus(booking.status),
                    lastBookedBy: undefined,
                };
            });

            return { ...zone, seats };
        });
    }, [bookings]);

    const selectedZone = zones.find(i => i.id === selectedItem);

    useEffect(() => {
        let isMounted = true;

        const loadFriends = async () => {
            if (!user) return;
            setFriendsLoading(true);
            setFriendsError(null);
            try {
                const edges = await SocialService.listFriendships(user.id);
                const accepted = edges
                    .filter(edge => edge.status === 'accepted')
                    .map(edge => (edge.requesterId === user.id ? edge.receiver : edge.requester))
                    .filter((profile): profile is ProfileSummary => !!profile);

                if (isMounted) {
                    setFriends(accepted);
                }
            } catch (error) {
                if (isMounted) {
                    setFriendsError(error instanceof Error ? error.message : 'Unable to load friends.');
                }
            } finally {
                if (isMounted) {
                    setFriendsLoading(false);
                }
            }
        };

        loadFriends();
        return () => {
            isMounted = false;
        };
    }, [user]);

    useEffect(() => {
        let isMounted = true;

        const loadInviteCount = async () => {
            if (!user) {
                setPendingInviteCount(0);
                return;
            }
            try {
                const invites = await BookingService.listInvitesForUser(user.id);
                const pending = invites.filter(invite => invite.status === 'pending').length;
                if (isMounted) {
                    setPendingInviteCount(pending);
                }
            } catch {
                if (isMounted) {
                    setPendingInviteCount(0);
                }
            }
        };

        loadInviteCount();
        return () => {
            isMounted = false;
        };
    }, [user, selectedItem]);

    useEffect(() => {
        setSelectedSeatId(null);
        setInvitedFriendIds([]);
    }, [selectedItem]);

    useEffect(() => {
        setSelectedSlot(activeSlot);
    }, [activeSlot, selectedItem]);

    useEffect(() => {
        let isMounted = true;

        const loadBookings = async () => {
            setBookingsLoading(true);
            setBookingsError(null);
            try {
                const data = await BookingService.listBookings(activeDate, activeSlot);
                if (isMounted) {
                    setBookings(data);
                }
            } catch (error) {
                if (isMounted) {
                    setBookingsError(error instanceof Error ? error.message : 'Unable to load bookings.');
                }
            } finally {
                if (isMounted) {
                    setBookingsLoading(false);
                }
            }
        };

        loadBookings();

        return () => {
            isMounted = false;
        };
    }, [activeDate, activeSlot]);

    useEffect(() => {
        const channel = supabase
            .channel(`booking-availability-${activeDate}-${activeSlot}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
                BookingService.listBookings(activeDate, activeSlot)
                    .then(setBookings)
                    .catch(() => setBookingsError('Unable to refresh bookings.'));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeDate, activeSlot]);

    const getZoneStatus = (zone: BookableItem): BookingStatus => {
        if (zone.type === 'private-zone' || !zone.seats?.length) {
            return zone.status;
        }

        if (zone.seats.some(seat => seat.status === 'available')) return 'available';
        if (zone.seats.some(seat => seat.status === 'pending')) return 'pending';
        if (zone.seats.some(seat => seat.status === 'reserved')) return 'reserved';
        return 'occupied';
    };

    const getAvailableSeatCount = (zone: BookableItem) => {
        return zone.seats?.filter(seat => seat.status === 'available').length ?? 0;
    };

    const isZoneSelectable = (zone: BookableItem) => {
        if (zone.type === 'private-zone') {
            return getZoneStatus(zone) === 'available';
        }
        if (zone.seats?.length) {
            return zone.seats.some(seat => seat.status === 'available');
        }
        return getZoneStatus(zone) === 'available';
    };

    const selectedSeat = selectedZone?.seats?.find(seat => seat.id === selectedSeatId);
    const requiredInviteCount = selectedZone?.minInviteCount ?? 3;
    const inviteRequirementMet = selectedZone?.type === 'private-zone'
        ? invitedFriendIds.length >= requiredInviteCount
        : true;
    const isSeatRequirementMet = selectedZone?.type === 'private-zone'
        ? true
        : !!selectedSeat && selectedSeat.status === 'available';
    const isUserReady = !!user;
    const isBookEnabled = !!selectedZone && !!selectedSlot && inviteRequirementMet && isSeatRequirementMet && isUserReady;

    const handleBook = async () => {
        if (!selectedZone || !selectedSlot || !user) {
            setBookingActionError('Please sign in and select a time slot.');
            return;
        }

        setBookingActionError(null);
        setIsSubmitting(true);

        try {
            if (selectedZone.type === 'private-zone') {
                if (!inviteRequirementMet) {
                    setBookingActionError(`Invite at least ${requiredInviteCount} friends.`);
                    return;
                }

                await BookingService.createPrivateBooking({
                    zoneId: selectedZone.id,
                    bookingDate: activeDate,
                    slotLabel: selectedSlot,
                    userId: user.id,
                    inviteeIds: invitedFriendIds,
                });
            } else {
                if (!selectedSeat || selectedSeat.status !== 'available') {
                    setBookingActionError('Select an available seat.');
                    return;
                }

                await BookingService.createSeatBooking({
                    zoneId: selectedZone.id,
                    seatId: selectedSeat.id,
                    bookingDate: activeDate,
                    slotLabel: selectedSlot,
                    userId: user.id,
                });
            }

            const updatedBookings = await BookingService.listBookings(activeDate, activeSlot);
            setBookings(updatedBookings);
            setSelectedItem(null);
        } catch (error) {
            setBookingActionError(error instanceof Error ? error.message : 'Unable to complete booking.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const stats = zones.reduce((acc, zone) => {
        const zoneStatus = getZoneStatus(zone);
        acc.total += 1;
        acc[zoneStatus] += 1;
        return acc;
    }, {
        total: 0,
        available: 0,
        occupied: 0,
        reserved: 0,
        pending: 0,
    } as Record<BookingStatus | 'total', number>);

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
                        <Link to="/my-bookings">
                            <Button variant="outline" className="p-2 text-xs">
                                My Bookings
                                {pendingInviteCount > 0 && (
                                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-black text-white text-[10px] px-1.5 py-0.5">
                                        {pendingInviteCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        {/* View Mode Toggle */}
                        <div className="flex border border-gray-200 rounded-md overflow-hidden">
                            <Button 
                                variant={viewMode === 'grid' ? 'primary' : 'outline'} 
                                onClick={() => setViewMode('grid')} 
                                className={`p-2 rounded-none border-0 ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant={viewMode === 'list' ? 'primary' : 'outline'} 
                                onClick={() => setViewMode('list')} 
                                className={`p-2 rounded-none border-0 ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white'}`}
                            >
                                <List className="w-4 h-4" />
                            </Button>
                        </div>
                        
                        {/* Zoom Controls - Only show in grid mode */}
                        {viewMode === 'grid' && (
                            <>
                                <div className="h-8 w-px bg-gray-300" />
                                <Button variant="outline" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-2">
                                    <ZoomOut className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" onClick={() => setZoom(1)} className="p-2">
                                    <Maximize2 className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" onClick={() => setZoom(Math.min(1.5, zoom + 0.25))} className="p-2">
                                    <ZoomIn className="w-4 h-4" />
                                </Button>
                            </>
                        )}
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
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-indigo-50 border-2 border-indigo-400" />
                            <span>Pending ({stats.pending})</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300" />
                        <span>▫ 1P Desk</span>
                        <span>▬ Double</span>
                        <span>● 3P Round</span>
                        <span>▭ 6P Table</span>
                        <span>▣ Private</span>
                    </div>
                </div>

                {/* Slot + Date Filter */}
                <div className="bg-white border border-gray-200 p-3 mb-4 flex flex-wrap items-center gap-3 text-xs">
                    <label className="flex items-center gap-2">
                        <span className="font-mono uppercase text-gray-500">Date</span>
                        <input
                            type="date"
                            value={activeDate}
                            onChange={(event) => setActiveDate(event.target.value)}
                            className="border border-gray-200 rounded px-2 py-1 text-xs"
                        />
                    </label>
                    <label className="flex items-center gap-2">
                        <span className="font-mono uppercase text-gray-500">Slot</span>
                        <select
                            value={activeSlot}
                            onChange={(event) => setActiveSlot(event.target.value)}
                            className="border border-gray-200 rounded px-2 py-1 text-xs"
                        >
                            {TIME_SLOTS.map((slot) => (
                                <option key={slot} value={slot}>{slot}</option>
                            ))}
                        </select>
                    </label>
                    <span className="text-[10px] text-gray-500">
                        Availability updates for selected slot.
                    </span>
                    {bookingsLoading && (
                        <span className="text-[10px] text-gray-400">Refreshing…</span>
                    )}
                    {bookingsError && (
                        <span className="text-[10px] text-red-600">{bookingsError}</span>
                    )}
                </div>

                {/* Main Content - Grid or List View */}
                {viewMode === 'grid' ? (
                    /* Grid View */
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
                                {zones.map((item) => {
                                    const zoneStatus = getZoneStatus(item);
                                    const statusStyles = STATUS_STYLES[zoneStatus];
                                    const typeStyle = TYPE_STYLES[item.type];
                                    const isSelected = selectedItem === item.id;
                                    const isClickable = isZoneSelectable(item);

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

                                                {/* Seat Availability */}
                                                {item.seats?.length ? (
                                                    <span className="font-mono text-[7px] opacity-60">
                                                        {getAvailableSeatCount(item)}/{item.seats.length} seats free
                                                    </span>
                                                ) : null}

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
                                                {zoneStatus}
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
                ) : (
                    /* List View */
                    <div className="bg-white border border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-4 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b-2 border-black">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider">ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider">Capacity</th>
                                        <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider">Seats</th>
                                        <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider">Booked By</th>
                                        <th className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {zones.map((item) => {
                                        const zoneStatus = getZoneStatus(item);
                                        const statusStyles = STATUS_STYLES[zoneStatus];
                                        const typeStyle = TYPE_STYLES[item.type];
                                        const isSelected = selectedItem === item.id;
                                        const isClickable = isZoneSelectable(item);
                                        const seatSummary = item.seats?.length
                                            ? `${getAvailableSeatCount(item)}/${item.seats.length} free`
                                            : '-';

                                        return (
                                            <tr 
                                                key={item.id}
                                                className={`
                                                    transition-all duration-150
                                                    ${isSelected ? 'bg-black text-white' : 'hover:bg-gray-50'}
                                                    ${!isClickable ? 'opacity-60' : ''}
                                                `}
                                            >
                                                <td className="px-4 py-3 text-xs font-mono">{item.id}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{typeStyle.icon}</span>
                                                        <span className="text-xs font-mono">{TYPE_LABELS[item.type]}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    {item.capacity ? `${item.capacity} ${item.capacity === 1 ? 'person' : 'people'}` : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-mono">{seatSummary}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`
                                                        inline-flex px-2 py-1 text-xs font-mono uppercase
                                                        border rounded ${isSelected ? 'border-white bg-white/20' : statusStyles.badge}
                                                    `}>
                                                        {zoneStatus}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {item.lastBookedBy ? (
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            <span>{item.lastBookedBy}</span>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isClickable && (
                                                        <Button 
                                                            onClick={() => setSelectedItem(isSelected ? null : item.id)}
                                                            className={`text-xs ${isSelected ? 'bg-white text-black' : 'bg-black text-white'}`}
                                                        >
                                                            {isSelected ? 'Deselect' : 'Select'}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Selected Item Details */}
                {selectedZone && (
                    <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-mono text-xs uppercase tracking-wider text-gray-500">
                                        {selectedZone.id} • {TYPE_LABELS[selectedZone.type]} • Capacity: {selectedZone.capacity || 'N/A'}
                                    </p>
                                    <p className="font-bold text-lg mt-1">{selectedZone.name}</p>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setSelectedItem(null)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        className="bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                                        disabled={!isBookEnabled || isSubmitting}
                                        onClick={handleBook}
                                    >
                                        {isSubmitting
                                            ? 'Booking...'
                                            : selectedZone.type === 'private-zone'
                                                ? 'Request Private Zone'
                                                : 'Book Seat'}
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 space-y-4">
                                    {/* Time Slot Selection */}
                                    <div>
                                        <p className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">
                                            Choose Time Slot
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {TIME_SLOTS.map((slot) => (
                                                <Button
                                                    key={slot}
                                                    variant={selectedSlot === slot ? 'primary' : 'outline'}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`text-xs ${selectedSlot === slot ? 'bg-black text-white' : ''}`}
                                                >
                                                    {slot}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Seat Selection */}
                                    {selectedZone.type !== 'private-zone' && selectedZone.seats?.length ? (
                                        <div>
                                            <p className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">
                                                Pick Your Seat (Random Seating)
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedZone.seats.map((seat) => (
                                                    <Button
                                                        key={seat.id}
                                                        variant={selectedSeatId === seat.id ? 'primary' : 'outline'}
                                                        onClick={() => seat.status === 'available' && setSelectedSeatId(seat.id)}
                                                        className={`text-xs ${selectedSeatId === seat.id ? 'bg-black text-white' : ''}`}
                                                        disabled={seat.status !== 'available'}
                                                    >
                                                        Seat {seat.label} • {seat.status}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    {/* Private Zone Invites */}
                                    {selectedZone.type === 'private-zone' && (
                                        <div>
                                            <p className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-2">
                                                Invite Friends (min {requiredInviteCount})
                                            </p>
                                            {!user && (
                                                <p className="text-xs text-gray-500">
                                                    Sign in to invite friends and request a private zone.
                                                </p>
                                            )}
                                            {user && (
                                                <div className="space-y-2">
                                                    {friendsLoading && (
                                                        <p className="text-xs text-gray-500">Loading friends…</p>
                                                    )}
                                                    {friendsError && (
                                                        <p className="text-xs text-red-600">{friendsError}</p>
                                                    )}
                                                    {!friendsLoading && !friendsError && friends.length === 0 && (
                                                        <p className="text-xs text-gray-500">No friends yet. Add friends to invite them.</p>
                                                    )}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {friends.map((friend) => (
                                                            <label
                                                                key={friend.id}
                                                                className={`flex items-center gap-2 border rounded px-2 py-1 text-xs cursor-pointer ${
                                                                    invitedFriendIds.includes(friend.id)
                                                                        ? 'border-black bg-gray-50'
                                                                        : 'border-gray-200'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={invitedFriendIds.includes(friend.id)}
                                                                    onChange={() => setInvitedFriendIds((prev) =>
                                                                        prev.includes(friend.id)
                                                                            ? prev.filter((id) => id !== friend.id)
                                                                            : [...prev, friend.id],
                                                                    )}
                                                                />
                                                                <span>{friend.fullName}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-gray-500 mt-2">
                                                Private zone stays pending until invited friends confirm.
                                            </p>
                                        </div>
                                    )}
                                    {bookingActionError && (
                                        <p className="text-xs text-red-600">{bookingActionError}</p>
                                    )}
                                </div>

                                {/* Booking Summary */}
                                <div className="bg-gray-50 border border-gray-200 p-3 text-xs space-y-2">
                                    <p className="font-mono uppercase tracking-wider text-gray-500">Summary</p>
                                    <div className="flex justify-between">
                                        <span>Zone</span>
                                        <span className="font-mono">{selectedZone.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Type</span>
                                        <span className="font-mono">{TYPE_LABELS[selectedZone.type]}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Time Slot</span>
                                        <span className="font-mono">{selectedSlot || 'Select'}</span>
                                    </div>
                                    {selectedZone.type !== 'private-zone' && (
                                        <div className="flex justify-between">
                                            <span>Seat</span>
                                            <span className="font-mono">{selectedSeat ? `Seat ${selectedSeat.label}` : 'Select'}</span>
                                        </div>
                                    )}
                                    {selectedZone.type === 'private-zone' && (
                                        <div className="flex justify-between">
                                            <span>Invites</span>
                                            <span className="font-mono">{invitedFriendIds.length}/{requiredInviteCount}</span>
                                        </div>
                                    )}
                                    {!user && (
                                        <p className="text-[10px] text-gray-500">Sign in to complete a booking.</p>
                                    )}
                                    {!selectedSlot && (
                                        <p className="text-[10px] text-amber-700">Select a time slot to continue.</p>
                                    )}
                                    {!isSeatRequirementMet && selectedZone.type !== 'private-zone' && (
                                        <p className="text-[10px] text-amber-700">Select an available seat.</p>
                                    )}
                                    {!inviteRequirementMet && selectedZone.type === 'private-zone' && (
                                        <p className="text-[10px] text-amber-700">Invite at least {requiredInviteCount} friends.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                    <div className="bg-white border border-gray-200 p-3">
                        <p className="text-[10px] font-mono text-gray-500 uppercase">Pending</p>
                        <p className="text-xl font-bold text-indigo-600">{stats.pending}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
