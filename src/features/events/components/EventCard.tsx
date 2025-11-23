import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, Users, Trash2 } from 'lucide-react';
import type { Event } from '../types';
import { Button } from '../../../shared/ui/Button';
import { SchematicAvatar } from '../../../shared/ui/SchematicAvatar';

interface EventCardProps {
    event: Event;
    onVote?: (eventId: string) => void;
    onJoin?: (eventId: string) => void;
    onDelete?: (eventId: string) => void;
    isVoting?: boolean;
    isJoining?: boolean;
    isOwner?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
    event,
    onVote,
    onJoin,
    onDelete,
    isVoting = false,
    isJoining = false,
    isOwner = false,
}) => {
    const isProposal = event.status === 'proposal';
    const votes = event.votes?.[0]?.count || 0;
    const progress = Math.min((votes / 10) * 100, 100);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${!isProposal ? 'border-l-4 border-l-black border-y-gray-200 border-r-gray-200' : 'border-gray-200'}`}
        >

            {event.poster_url && (
                <div className="relative h-48 w-full border-b border-gray-200">
                    <img
                        src={event.poster_url}
                        alt={event.title}
                        className="h-full w-full object-cover"
                    />
                </div>
            )}

            <div className="p-5 pl-7">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-black transition-colors font-mono">
                            {event.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <SchematicAvatar size={24} seed={event.creator_id} />
                            <span>Proposed by Creator</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 ${isProposal
                            ? 'border border-dashed border-gray-400 text-gray-500 bg-transparent'
                            : 'bg-black text-white border border-black'
                            }`}>
                            {event.status}
                        </span>
                        {isOwner && (
                            <button
                                onClick={() => onDelete?.(event.id)}
                                className="mt-1 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete Event"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Description */}
                <p className="mb-6 text-sm text-gray-600 line-clamp-2">
                    {event.description}
                </p>

                {/* Meta Info */}
                <div className="mb-6 flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(event.event_date)}</span>
                    </div>
                    {isProposal && (
                        <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>{votes} / 10 Votes</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
                    {isProposal ? (
                        <div className="w-full">
                            <div className="flex items-end gap-3">
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between text-[10px] font-mono uppercase text-gray-500">
                                        <span>Progress to Official</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="relative h-1.5 w-full overflow-hidden bg-gray-100">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="absolute h-full bg-black"
                                        />
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className={`h-9 w-9 p-0 flex items-center justify-center border-black hover:bg-gray-100 ${event.user_has_voted ? 'bg-black text-white hover:bg-black/90' : 'text-black'}`}
                                    onClick={() => onVote?.(event.id)}
                                    disabled={isVoting}
                                    title={event.user_has_voted ? 'Voted' : 'Vote for this event'}
                                >
                                    <Heart className={`h-4 w-4 ${event.user_has_voted ? 'fill-white text-white' : ''}`} />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant={event.user_has_joined ? "outline" : "primary"}
                            className="w-full justify-center"
                            onClick={() => onJoin?.(event.id)}
                            disabled={isJoining || event.user_has_joined}
                        >
                            {event.user_has_joined ? 'RSVP Confirmed' : 'Join Event'}
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
