import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Vote, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../shared/context/AuthContext';
import { EventsService } from './services/EventsService';
import type { Event, CreateEventFormData } from './types';
import { EventCard } from './components/EventCard';
import { CreateEventDialog } from './components/CreateEventDialog';
import { Button } from '../../shared/ui/Button';

export const EventsPage: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'proposals' | 'calendar'>('proposals');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [proposals, setProposals] = useState<Event[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
    const [userParticipations, setUserParticipations] = useState<Set<string>>(new Set());
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [proposalsData, upcomingData] = await Promise.all([
                EventsService.getProposals(),
                EventsService.getUpcoming(),
            ]);

            if (user) {
                const [votes, participations] = await Promise.all([
                    EventsService.getUserVotes(user.id),
                    EventsService.getUserParticipations(user.id),
                ]);
                setUserVotes(new Set(votes));
                setUserParticipations(new Set(participations));
            }

            setProposals(proposalsData);
            setUpcomingEvents(upcomingData);
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleCreateEvent = async (data: CreateEventFormData) => {
        if (!user) return;
        await EventsService.createEvent(data, user.id);
        await fetchData();
    };

    const handleVote = async (eventId: string) => {
        if (!user) return;
        setProcessingId(eventId);
        try {
            await EventsService.vote(eventId, user.id);
            await fetchData();
        } catch (error) {
            console.error('Failed to vote:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleJoin = async (eventId: string) => {
        if (!user) return;
        setProcessingId(eventId);
        try {
            await EventsService.join(eventId, user.id);
            await fetchData();
        } catch (error) {
            console.error('Failed to join:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async (eventId: string) => {
        if (!user) return;
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

        setProcessingId(eventId);
        try {
            await EventsService.deleteEvent(eventId);
            await fetchData();
        } catch (error) {
            console.error('Failed to delete event:', error);
        } finally {
            setProcessingId(null);
        }
    };

    // Enrich events with user state
    const enrichedProposals = proposals.map(p => ({
        ...p,
        user_has_voted: userVotes.has(p.id),
    }));

    const enrichedUpcoming = upcomingEvents.map(e => ({
        ...e,
        user_has_joined: userParticipations.has(e.id),
    }));

    return (
        <div className="space-y-6">
            {/* Header Section inside Profile Tab */}
            <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-bold">Community Events</h2>
                        <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                            Propose, vote, and join events
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 border-black hover:bg-black hover:text-white transition-colors whitespace-nowrap"
                        onClick={() => setIsCreateDialogOpen(true)}
                    >
                        Create Event
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-gray-200 pb-4 mb-6">
                    <button
                        onClick={() => setActiveTab('proposals')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${activeTab === 'proposals'
                            ? 'bg-black text-white'
                            : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        <Vote className="h-3.5 w-3.5" />
                        <span>Proposals</span>
                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'proposals' ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                            }`}>
                            {proposals.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-sm font-medium ${activeTab === 'calendar'
                            ? 'bg-black text-white'
                            : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>Calendar</span>
                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'calendar' ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                            }`}>
                            {upcomingEvents.length}
                        </span>
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex h-32 items-center justify-center text-gray-400 text-sm">
                        Loading events...
                    </div>
                ) : (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid gap-4 md:grid-cols-2"
                    >
                        {activeTab === 'proposals' ? (
                            enrichedProposals.length > 0 ? (
                                enrichedProposals.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onVote={handleVote}
                                        onDelete={handleDelete}
                                        isVoting={processingId === event.id}
                                        isOwner={user?.id === event.creator_id}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-8 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                                    No proposals yet. Be the first to create one!
                                </div>
                            )
                        ) : (
                            enrichedUpcoming.length > 0 ? (
                                enrichedUpcoming.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        onJoin={handleJoin}
                                        onDelete={handleDelete}
                                        isJoining={processingId === event.id}
                                        isOwner={user?.id === event.creator_id}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-8 text-center text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                                    No upcoming confirmed events. Vote on proposals!
                                </div>
                            )
                        )}
                    </motion.div>
                )}
            </div>

            <CreateEventDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onSubmit={handleCreateEvent}
            />
        </div>
    );
};
