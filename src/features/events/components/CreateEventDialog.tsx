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
                        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
                    >
                        <div className="mb-6 flex items-center justify-between border-b-2 border-black pb-4">
                            <h2 className="text-xl font-bold text-black font-mono uppercase tracking-tight">Propose New Event</h2>
                            <button
                                onClick={onClose}
                                className="rounded-none p-1 text-black hover:bg-black hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                            {errors.root && (
                                <div className="flex items-center gap-2 border border-red-500 bg-red-50 p-3 text-sm text-red-600 font-mono">
                                    <AlertCircle className="h-4 w-4" />
                                    {errors.root.message}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase font-mono tracking-wider">Event Title</label>
                                <input
                                    {...register('title')}
                                    className="w-full rounded-none border border-gray-300 bg-transparent px-3 py-2 text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-all font-mono text-sm"
                                    placeholder="E.G., COMMUNITY HACKATHON 2024"
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-600 font-mono mt-1">{errors.title.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase font-mono tracking-wider">Description</label>
                                <textarea
                                    {...register('description')}
                                    rows={3}
                                    className="w-full rounded-none border border-gray-300 bg-transparent px-3 py-2 text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-all font-mono text-sm"
                                    placeholder="DESCRIBE THE EVENT PARAMETERS..."
                                />
                                {errors.description && (
                                    <p className="text-xs text-red-600 font-mono mt-1">{errors.description.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase font-mono tracking-wider">Proposed Date</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        {...register('event_date', { valueAsDate: true })}
                                        min={minDateString}
                                        className="w-full rounded-none border border-gray-300 bg-transparent px-3 py-2 pl-10 text-black placeholder-gray-400 focus:border-black focus:outline-none focus:ring-0 transition-all font-mono text-sm"
                                    />
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                                <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Must be at least 21 days in advance</p>
                                {errors.event_date && (
                                    <p className="text-xs text-red-600 font-mono mt-1">{errors.event_date.message}</p>
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
