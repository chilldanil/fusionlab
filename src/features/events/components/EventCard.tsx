import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, Users, CheckCircle, Trash2 } from 'lucide-react';
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
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-black hover:shadow-md"
        >
            {/* Status Stripe */}
            <div className={`absolute left-0 top-0 h-full w-1 ${isProposal ? 'bg-yellow-400' : 'bg-green-500'}`} />

            <div className="p-5 pl-7">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-black group-hover:text-blue-600 transition-colors">
                            {event.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <SchematicAvatar size={24} seed={event.creator_id} />
                            <span>Proposed by Creator</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${isProposal
                                ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                                : 'border-green-200 text-green-700 bg-green-50'
                            }`}>
                            {event.status.toUpperCase()}
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
                            <div className="mb-2 flex justify-between text-xs">
                                <span className="text-gray-500">Progress to Official</span>
                                <span className="text-blue-600">{Math.round(progress)}%</span>
                            </div>
                            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="absolute h-full bg-blue-600"
                                />
                            </div>
                            <div className="mt-4">
                                <Button
                                    variant={event.user_has_voted ? "outline" : "primary"}
                                    className="w-full gap-2 justify-center"
                                    onClick={() => onVote?.(event.id)}
                                    disabled={isVoting}
                                >
                                    <Heart className={`h-4 w-4 ${event.user_has_voted ? 'fill-current text-red-500 border-red-500' : ''}`} />
                                    {event.user_has_voted ? 'Voted' : 'Vote'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant={event.user_has_joined ? "outline" : "primary"}
                            className="w-full gap-2 justify-center"
                            onClick={() => onJoin?.(event.id)}
                            disabled={isJoining || event.user_has_joined}
                        >
                            <CheckCircle className="h-4 w-4" />
                            {event.user_has_joined ? 'RSVP Confirmed' : 'Join Event'}
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
