import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { createEventSchema, type CreateEventFormData } from '../types';
import { Button } from '../../../shared/ui/Button';

interface CreateEventDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateEventFormData) => Promise<void>;
}

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        reset,
    } = useForm<CreateEventFormData>({
        resolver: zodResolver(createEventSchema),
    });

    const handleFormSubmit = async (data: CreateEventFormData) => {
        try {
            await onSubmit(data);
            reset();
            onClose();
        } catch (error: any) {
            setError('root', {
                message: error.message || 'Failed to create event',
            });
        }
    };

    // Calculate min date for the date picker (21 days from now)
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 21);
    const minDateString = minDate.toISOString().split('T')[0];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-2xl"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Propose New Event</h2>
                            <button
                                onClick={onClose}
                                className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                            {errors.root && (
                                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.root.message}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/70">Event Title</label>
                                <input
                                    {...register('title')}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="e.g., Community Hackathon 2024"
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-400">{errors.title.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/70">Description</label>
                                <textarea
                                    {...register('description')}
                                    rows={3}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Describe what this event is about..."
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-400">{errors.description.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-white/70">Proposed Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        {...register('event_date', { valueAsDate: true })}
                                        min={minDateString}
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pl-10 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                                    />
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
                                </div>
                                <p className="text-xs text-white/40">Must be at least 21 days in advance</p>
                                {errors.event_date && (
                                    <p className="text-xs text-red-400">{errors.event_date.message}</p>
                                )}
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full justify-center"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
