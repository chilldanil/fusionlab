import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Calendar, Inbox, ArrowLeft, Bell } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import { Button } from '../../shared/ui/Button';
import { AnimatedCircuitBackground } from '../landing/components/AnimatedCircuitBackground';
import { BookingService, type BookingInviteRecord, type BookingNotificationRecord, type BookingRecord } from './services/BookingService';
import { supabase } from '../../shared/config/supabase';

type TabOption = 'bookings' | 'invites' | 'notifications';

const PRIVATE_INVITE_MIN = 3;

const TIME_SLOTS = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00',
];

const getSlotTimes = (booking: BookingRecord) => {
    const [startLabel, endLabel] = booking.slot_label.split(' - ');
    const start = new Date(`${booking.booking_date}T${startLabel}:00`);
    const end = new Date(`${booking.booking_date}T${endLabel}:00`);
    return { start, end };
};

const formatTimeDiff = (target: Date) => {
    const diffMs = target.getTime() - Date.now();
    const minutes = Math.ceil(diffMs / 60000);
    if (minutes <= 0) return 'now';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return `${hours}h ${remaining}m`;
};

const getSlotIndex = (slotLabel: string) => TIME_SLOTS.indexOf(slotLabel);

const buildKeyId = (booking: BookingRecord) => {
    if (booking.seat_id) return booking.seat_id;
    return booking.zone_id;
};

const statusBadge = (status: string) => {
    const styleMap: Record<string, string> = {
        pending: 'bg-indigo-50 border-indigo-300 text-indigo-700',
        reserved: 'bg-amber-50 border-amber-300 text-amber-700',
        confirmed: 'bg-green-50 border-green-300 text-green-700',
        cancelled: 'bg-gray-50 border-gray-300 text-gray-500',
        accepted: 'bg-green-50 border-green-300 text-green-700',
        rejected: 'bg-red-50 border-red-300 text-red-700',
    };
    return styleMap[status] || 'bg-gray-50 border-gray-200 text-gray-500';
};

export const MyBookingsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabOption>('bookings');
    const [bookings, setBookings] = useState<BookingRecord[]>([]);
    const [invites, setInvites] = useState<BookingInviteRecord[]>([]);
    const [notifications, setNotifications] = useState<BookingNotificationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);
    const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
    const [bookingInvites, setBookingInvites] = useState<BookingInviteRecord[]>([]);
    const [invitesLoading, setInvitesLoading] = useState(false);
    const [previousBooking, setPreviousBooking] = useState<BookingRecord | null>(null);
    const [handoffLoading, setHandoffLoading] = useState(false);
    const [currentHolder, setCurrentHolder] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const [bookingRows, inviteRows, notificationRows] = await Promise.all([
                BookingService.listBookingsForUser(user.id),
                BookingService.listInvitesForUser(user.id),
                BookingService.listNotifications(user.id),
            ]);
            setBookings(bookingRows);
            setInvites(inviteRows);
            setNotifications(notificationRows);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load booking data.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        let isMounted = true;
        const loadBookingInvites = async () => {
            if (!selectedBookingId) {
                setBookingInvites([]);
                return;
            }
            setInvitesLoading(true);
            try {
                const data = await BookingService.listInvitesForBooking(selectedBookingId);
                if (isMounted) {
                    setBookingInvites(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Unable to load booking invites.');
                }
            } finally {
                if (isMounted) {
                    setInvitesLoading(false);
                }
            }
        };

        loadBookingInvites();
        return () => {
            isMounted = false;
        };
    }, [selectedBookingId]);

    const handleCancel = async (bookingId: string) => {
        setActionId(bookingId);
        setError(null);
        try {
            await BookingService.cancelBooking(bookingId);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to cancel booking.');
        } finally {
            setActionId(null);
        }
    };

    const handleInviteResponse = async (invite: BookingInviteRecord, status: 'accepted' | 'rejected') => {
        setActionId(invite.id);
        setError(null);
        try {
            await BookingService.respondToInvite(invite.id, status);
            if (status === 'accepted' && invite.booking_id) {
                await BookingService.tryConfirmPrivateBooking(invite.booking_id, PRIVATE_INVITE_MIN);
            }
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update invitation.');
        } finally {
            setActionId(null);
        }
    };

    const handleCheckIn = async (bookingId: string) => {
        setActionId(bookingId);
        setError(null);
        try {
            await BookingService.confirmArrival(bookingId);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to confirm arrival.');
        } finally {
            setActionId(null);
        }
    };

    const handleHandoff = async (booking: BookingRecord) => {
        if (!user) return;
        setActionId(booking.id);
        setError(null);
        try {
            await BookingService.confirmHandoff(
                booking.id,
                user.id,
                buildKeyId(booking),
                booking.zone_id,
                booking.seat_id,
            );
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to confirm handoff.');
        } finally {
            setActionId(null);
        }
    };

    const handleMarkRead = async (notificationId: string) => {
        setActionId(notificationId);
        setError(null);
        try {
            await BookingService.markNotificationRead(notificationId);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to update notification.');
        } finally {
            setActionId(null);
        }
    };

    const handleNoShowRelease = async (bookingId: string) => {
        setActionId(bookingId);
        setError(null);
        try {
            await BookingService.cancelBooking(bookingId);
            await loadData();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to release booking.');
        } finally {
            setActionId(null);
        }
    };

    const upcomingBookings = useMemo(
        () => bookings.filter((booking) => booking.status !== 'cancelled'),
        [bookings],
    );

    const pendingInvitesCount = useMemo(
        () => invites.filter((invite) => invite.status === 'pending').length,
        [invites],
    );

    const unreadNotificationsCount = useMemo(
        () => notifications.filter((note) => !note.read_at).length,
        [notifications],
    );

    const selectedBooking = useMemo(
        () => upcomingBookings.find((booking) => booking.id === selectedBookingId) || null,
        [upcomingBookings, selectedBookingId],
    );

    useEffect(() => {
        let isMounted = true;
        const loadPreviousBooking = async () => {
            if (!selectedBooking) {
                setPreviousBooking(null);
                setCurrentHolder(null);
                return;
            }
            setHandoffLoading(true);
            try {
                const data = await BookingService.listBookingsForResource({
                    bookingDate: selectedBooking.booking_date,
                    zoneId: selectedBooking.zone_id,
                    seatId: selectedBooking.seat_id,
                });
                const currentIndex = getSlotIndex(selectedBooking.slot_label);
                const previous = data
                    .filter((booking) => getSlotIndex(booking.slot_label) < currentIndex)
                    .sort((a, b) => getSlotIndex(b.slot_label) - getSlotIndex(a.slot_label))[0];
                if (isMounted) {
                    setPreviousBooking(previous || null);
                }

                const key = await BookingService.getPropertyKey({
                    zoneId: selectedBooking.zone_id,
                    seatId: selectedBooking.seat_id,
                });
                if (isMounted) {
                    setCurrentHolder(key?.holder?.full_name ?? key?.current_holder_id ?? null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Unable to load previous booking.');
                }
            } finally {
                if (isMounted) {
                    setHandoffLoading(false);
                }
            }
        };

        loadPreviousBooking();
        return () => {
            isMounted = false;
        };
    }, [selectedBooking]);

    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel(`booking-updates-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
                loadData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_invites' }, () => {
                loadData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_notifications' }, () => {
                loadData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'property_keys' }, () => {
                if (selectedBooking) {
                    BookingService.getPropertyKey({
                        zoneId: selectedBooking.zone_id,
                        seatId: selectedBooking.seat_id,
                    }).then((key) => setCurrentHolder(key?.holder?.full_name ?? key?.current_holder_id ?? null));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, loadData, selectedBooking]);

    const canCheckIn = useMemo(() => {
        if (!selectedBooking) return false;
        if (selectedBooking.arrival_confirmed_at) return false;
        const { start, end } = getSlotTimes(selectedBooking);
        const now = new Date();
        const windowStart = new Date(start.getTime() - 15 * 60 * 1000);
        return now >= windowStart && now <= end;
    }, [selectedBooking]);

    const canConfirmHandoff = useMemo(() => {
        if (!selectedBooking || !user) return false;
        if (!previousBooking) return false;
        if (selectedBooking.handoff_confirmed_at) return false;
        return !!selectedBooking.arrival_confirmed_at;
    }, [previousBooking, selectedBooking, user]);

    const canReleaseNoShow = useMemo(() => {
        if (!selectedBooking) return false;
        if (selectedBooking.arrival_confirmed_at) return false;
        const { start } = getSlotTimes(selectedBooking);
        const now = new Date();
        return now > new Date(start.getTime() + 15 * 60 * 1000);
    }, [selectedBooking]);

    const checkInMeta = useMemo(() => {
        if (!selectedBooking) return null;
        const { start, end } = getSlotTimes(selectedBooking);
        const windowStart = new Date(start.getTime() - 15 * 60 * 1000);
        const now = new Date();
        const windowOpen = now >= windowStart && now <= end;
        return {
            windowOpen,
            windowStart,
            start,
            end,
            label: selectedBooking.arrival_confirmed_at
                ? 'Checked in'
                : windowOpen
                    ? 'Check-in open'
                    : `Opens in ${formatTimeDiff(windowStart)}`,
        };
    }, [selectedBooking]);

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <AnimatedCircuitBackground />

            <div className="max-w-5xl mx-auto relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link 
                            to="/profile" 
                            className="p-2 bg-white border border-gray-200 rounded-md hover:border-black transition-colors group"
                        >
                            <Home className="w-5 h-5 text-gray-500 group-hover:text-black" />
                        </Link>
                        <div>
                            <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                                Booking Center
                            </p>
                            <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate('/booking')} className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Booking
                        </Button>
                    </div>
                </div>

                <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant={activeTab === 'bookings' ? 'primary' : 'outline'}
                            onClick={() => setActiveTab('bookings')}
                            className={`text-xs ${activeTab === 'bookings' ? 'bg-black text-white' : ''}`}
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            My Bookings
                        </Button>
                        <Button
                            variant={activeTab === 'invites' ? 'primary' : 'outline'}
                            onClick={() => setActiveTab('invites')}
                            className={`text-xs ${activeTab === 'invites' ? 'bg-black text-white' : ''}`}
                        >
                            <Inbox className="w-4 h-4 mr-2" />
                            Invitations
                            {pendingInvitesCount > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-black text-white text-[10px] px-1.5 py-0.5">
                                    {pendingInvitesCount}
                                </span>
                            )}
                        </Button>
                        <Button
                            variant={activeTab === 'notifications' ? 'primary' : 'outline'}
                            onClick={() => setActiveTab('notifications')}
                            className={`text-xs ${activeTab === 'notifications' ? 'bg-black text-white' : ''}`}
                        >
                            <Bell className="w-4 h-4 mr-2" />
                            Notifications
                            {unreadNotificationsCount > 0 && (
                                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-black text-white text-[10px] px-1.5 py-0.5">
                                    {unreadNotificationsCount}
                                </span>
                            )}
                        </Button>
                        {isLoading && <span className="text-xs text-gray-400">Refreshing…</span>}
                        {error && <span className="text-xs text-red-600">{error}</span>}
                    </div>
                </div>

                {activeTab === 'bookings' && (
                    <div className="bg-white border border-gray-200 shadow-sm">
                        {upcomingBookings.length === 0 ? (
                            <div className="p-6 text-sm text-gray-500">
                                No bookings yet. Go book a seat or private zone.
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-gray-100">
                                    {upcomingBookings.map((booking) => {
                                        const seatLabel = booking.seat_id ? booking.seat_id.split('-').slice(-1)[0] : null;
                                        const isSelected = selectedBookingId === booking.id;

                                        return (
                                            <div
                                                key={booking.id}
                                                className={`p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${isSelected ? 'bg-gray-50' : ''}`}
                                            >
                                                <div className="space-y-1">
                                                    <p className="text-xs font-mono uppercase text-gray-500">Booking</p>
                                                    <p className="font-semibold">
                                                        Zone {booking.zone_id}{seatLabel ? ` • Seat ${seatLabel}` : ''}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {booking.booking_date} • {booking.slot_label}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-mono uppercase border rounded ${statusBadge(booking.status)}`}>
                                                        {booking.status}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setSelectedBookingId(isSelected ? null : booking.id)}
                                                        className="text-xs"
                                                    >
                                                        {isSelected ? 'Hide Details' : 'View Details'}
                                                    </Button>
                                                    {booking.status !== 'cancelled' && (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleCancel(booking.id)}
                                                            disabled={actionId === booking.id}
                                                            className="text-xs"
                                                        >
                                                            {actionId === booking.id ? 'Cancelling…' : 'Cancel'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {selectedBooking && (
                                    <div className="border-t border-gray-200 p-4 bg-white">
                                        <p className="text-xs font-mono uppercase text-gray-500 mb-3">Booking Details</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-gray-500">Zone</p>
                                                <p className="font-semibold">{selectedBooking.zone_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Seat</p>
                                                <p className="font-semibold">{selectedBooking.seat_id ?? 'Private Zone'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Time</p>
                                                <p className="font-semibold">{selectedBooking.booking_date} • {selectedBooking.slot_label}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 border border-gray-200 rounded p-4 bg-gray-50 text-xs space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="font-mono uppercase text-gray-500">Arrival & Responsibility</p>
                                                {checkInMeta && (
                                                    <span className={`inline-flex px-2 py-1 text-[10px] font-mono uppercase border rounded ${checkInMeta.windowOpen ? 'border-green-300 text-green-700 bg-green-50' : 'border-gray-300 text-gray-500 bg-white'}`}>
                                                        {checkInMeta.label}
                                                    </span>
                                                )}
                                            </div>
                                            {checkInMeta && (
                                                <div className="h-2 rounded-full bg-white border border-gray-200 overflow-hidden">
                                                    <div
                                                        className={`h-full ${checkInMeta.windowOpen ? 'bg-green-400' : 'bg-gray-300'}`}
                                                        style={{
                                                            width: `${Math.min(100, Math.max(0, ((Date.now() - checkInMeta.windowStart.getTime()) / (checkInMeta.end.getTime() - checkInMeta.windowStart.getTime())) * 100))}%`,
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div className="border border-gray-200 rounded p-3 bg-white">
                                                    <p className="text-[10px] text-gray-500 uppercase">Step 1</p>
                                                    <p className="font-semibold mt-1">Check-in</p>
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        {checkInMeta?.windowOpen
                                                            ? 'Confirm you are on-site and accept responsibility.'
                                                            : 'Available 15 minutes before the slot.'}
                                                    </p>
                                                </div>
                                                <div className="border border-gray-200 rounded p-3 bg-white">
                                                    <p className="text-[10px] text-gray-500 uppercase">Step 2</p>
                                                    <p className="font-semibold mt-1">Handoff</p>
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        Verify the previous user left it clean to take over responsibility.
                                                    </p>
                                                </div>
                                                <div className="border border-gray-200 rounded p-3 bg-white">
                                                    <p className="text-[10px] text-gray-500 uppercase">Key</p>
                                                    <p className="font-semibold mt-1">{buildKeyId(selectedBooking)}</p>
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        Current holder: {currentHolder || 'Not assigned'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold">Arrival check-in</p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {checkInMeta?.windowOpen
                                                            ? 'Window is open. Please confirm now.'
                                                            : `Check-in opens 15 minutes before start (${checkInMeta ? formatTimeDiff(checkInMeta.windowStart) : ''}).`}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        className="text-xs bg-black text-white"
                                                        onClick={() => handleCheckIn(selectedBooking.id)}
                                                        disabled={!canCheckIn || actionId === selectedBooking.id}
                                                    >
                                                        {selectedBooking.arrival_confirmed_at
                                                            ? 'Checked In'
                                                            : actionId === selectedBooking.id
                                                                ? 'Confirming…'
                                                                : 'I’m here & I accept'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="text-xs"
                                                        onClick={() => handleNoShowRelease(selectedBooking.id)}
                                                        disabled={!canReleaseNoShow || actionId === selectedBooking.id}
                                                    >
                                                        {actionId === selectedBooking.id ? 'Releasing…' : 'Release (no‑show)'}
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold">Previous user condition</p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {previousBooking
                                                            ? 'Confirm previous user left everything clean.'
                                                            : 'No previous booking found for this slot.'}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="text-xs"
                                                    onClick={() => handleHandoff(selectedBooking)}
                                                    disabled={!canConfirmHandoff || actionId === selectedBooking.id}
                                                >
                                                    {selectedBooking.handoff_confirmed_at
                                                        ? 'Confirmed'
                                                        : actionId === selectedBooking.id
                                                            ? 'Confirming…'
                                                            : 'Confirm Condition'}
                                                </Button>
                                            </div>

                                            {handoffLoading && (
                                                <p className="text-[10px] text-gray-400">Checking previous booking…</p>
                                            )}
                                        </div>

                                        {selectedBooking.seat_id === null && (
                                            <div className="mt-4">
                                                <p className="text-xs font-mono uppercase text-gray-500 mb-2">Invites</p>
                                                {invitesLoading && (
                                                    <p className="text-xs text-gray-400">Loading invites…</p>
                                                )}
                                                {!invitesLoading && bookingInvites.length === 0 && (
                                                    <p className="text-xs text-gray-500">No invites yet.</p>
                                                )}
                                                <div className="space-y-2">
                                                    {bookingInvites.map((invite) => (
                                                        <div key={invite.id} className="flex items-center justify-between border border-gray-200 rounded px-3 py-2 text-xs">
                                                            <span>{invite.invitee?.full_name || invite.invitee_id}</span>
                                                            <span className={`inline-flex px-2 py-1 text-[10px] font-mono uppercase border rounded ${statusBadge(invite.status)}`}>
                                                                {invite.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'invites' && (
                    <div className="bg-white border border-gray-200 shadow-sm">
                        {invites.length === 0 ? (
                            <div className="p-6 text-sm text-gray-500">
                                No invitations yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {invites.map((invite) => (
                                    <div key={invite.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-mono uppercase text-gray-500">Invitation</p>
                                            <p className="font-semibold">
                                                {invite.booking
                                                    ? `Zone ${invite.booking.zone_id}`
                                                    : 'Private Zone Invite'}
                                            </p>
                                            {invite.booking && (
                                                <p className="text-sm text-gray-600">
                                                    {invite.booking.booking_date} • {invite.booking.slot_label}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                From {invite.inviter?.full_name || invite.inviter_id}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-mono uppercase border rounded ${statusBadge(invite.status)}`}>
                                                {invite.status}
                                            </span>
                                            {invite.status === 'pending' && (
                                                <>
                                                    <Button
                                                        onClick={() => handleInviteResponse(invite, 'accepted')}
                                                        disabled={actionId === invite.id}
                                                        className="text-xs bg-black text-white"
                                                    >
                                                        {actionId === invite.id ? 'Updating…' : 'Accept'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleInviteResponse(invite, 'rejected')}
                                                        disabled={actionId === invite.id}
                                                        className="text-xs"
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="bg-white border border-gray-200 shadow-sm">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-sm text-gray-500">
                                No notifications yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((note) => (
                                    <div key={note.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-mono uppercase text-gray-500">Notification</p>
                                            <p className="font-semibold">{note.type.replace(/_/g, ' ')}</p>
                                            <p className="text-sm text-gray-600">{note.message}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(note.created_at).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-mono uppercase border rounded ${note.read_at ? 'border-gray-200 text-gray-400 bg-gray-50' : 'border-green-300 text-green-700 bg-green-50'}`}>
                                                {note.read_at ? 'read' : 'new'}
                                            </span>
                                            {!note.read_at && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleMarkRead(note.id)}
                                                    disabled={actionId === note.id}
                                                    className="text-xs"
                                                >
                                                    {actionId === note.id ? 'Saving…' : 'Mark Read'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
