import React from 'react';
import { Button } from '../../shared/ui/Button';
import { SchematicAvatar } from '../../shared/ui/SchematicAvatar';
import { EventCard } from '../events/components/EventCard';
import { ConnectButton } from '../social/components/ConnectButton';
import type { Event } from '../events/types';

// --- MOCK DATA ---
const mockProposal: Event = {
    id: '1',
    title: 'Hackathon: AI for Good',
    description: 'A 48-hour marathon to build solutions for non-profits using local LLMs.',
    event_date: new Date(Date.now() + 86400000 * 25).toISOString(), // +25 days
    created_at: new Date().toISOString(),
    creator_id: 'user-1',
    status: 'proposal',
    votes: [{ count: 7 }],
    user_has_voted: false,
    user_has_joined: false,
};

const mockConfirmed: Event = {
    ...mockProposal,
    id: '2',
    title: 'Soldering Workshop v2',
    status: 'confirmed',
    votes: [{ count: 15 }],
    event_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    user_has_joined: true,
};

export const DesignSystemPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-12 font-sans text-black">
            <div className="max-w-5xl mx-auto space-y-16">

                {/* Header */}
                <div>
                    <h1 className="text-4xl font-bold font-mono mb-2">Design System v1.0</h1>
                    <p className="text-gray-500 font-mono uppercase tracking-widest">Engineering Blueprint / Monochrome</p>
                </div>

                {/* 1. Typography */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-black pb-2 mb-6">01. Typography</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <p className="text-6xl font-bold tracking-tight">Heading 1</p>
                            <p className="text-4xl font-bold tracking-tight">Heading 2</p>
                            <p className="text-2xl font-bold">Heading 3</p>
                            <p className="text-xl font-bold">Heading 4</p>
                        </div>
                        <div className="space-y-4">
                            <p className="font-mono text-sm text-gray-500 uppercase tracking-wider">Monospace Label</p>
                            <p className="text-base leading-relaxed text-gray-600">
                                Body text. A precision-engineered workspace for creators, innovators, and builders.
                                Designed for the next generation of technical excellence.
                            </p>
                            <p className="text-xs text-gray-400 font-mono">Caption / Metadata text</p>
                        </div>
                    </div>
                </section>

                {/* 2. Buttons & States */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-black pb-2 mb-6">02. Interactive Elements</h2>

                    <div className="space-y-4">
                        <h3 className="font-mono text-xs text-gray-400 uppercase">Main Buttons</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button variant="primary">Primary Action</Button>
                            <Button variant="outline">Secondary Action</Button>
                            <Button variant="primary" disabled>Disabled</Button>
                            <Button variant="outline" disabled>Disabled</Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-mono text-xs text-gray-400 uppercase">Context Buttons</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <ConnectButton status="idle" />
                            <ConnectButton status="pending" />
                            <ConnectButton status="connected" />
                        </div>
                    </div>
                </section>

                {/* 3. Avatars */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-black pb-2 mb-6">03. Identity</h2>
                    <div className="flex gap-8 items-end">
                        <div className="text-center space-y-2">
                            <SchematicAvatar seed="Alex" size={80} className="border border-black" />
                            <p className="font-mono text-xs">Size 80</p>
                        </div>
                        <div className="text-center space-y-2">
                            <SchematicAvatar seed="Maria" size={48} className="border border-gray-300" />
                            <p className="font-mono text-xs">Size 48</p>
                        </div>
                        <div className="text-center space-y-2">
                            <SchematicAvatar seed="John" size={32} className="border border-gray-300" />
                            <p className="font-mono text-xs">Size 32</p>
                        </div>
                    </div>
                </section>

                {/* 4. Cards */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-black pb-2 mb-6">04. Components</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <p className="font-mono text-xs text-gray-400 uppercase">Event Proposal</p>
                            <EventCard event={mockProposal} isVoting={false} />
                        </div>
                        <div className="space-y-2">
                            <p className="font-mono text-xs text-gray-400 uppercase">Confirmed Event</p>
                            <EventCard event={mockConfirmed} isJoining={false} />
                        </div>
                    </div>
                </section>

                {/* 5. Inputs (Visual Check) */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold border-b border-black pb-2 mb-6">05. Forms</h2>
                    <div className="max-w-md space-y-4 p-6 bg-white border border-gray-200">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase font-mono tracking-wider">Input Field</label>
                            <input
                                type="text"
                                placeholder="Placeholder text..."
                                className="w-full border border-gray-300 px-3 py-2 text-sm font-mono focus:border-black focus:outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase font-mono tracking-wider">Error State</label>
                            <input
                                type="text"
                                defaultValue="Invalid value"
                                className="w-full border border-red-500 text-red-600 px-3 py-2 text-sm font-mono focus:outline-none"
                            />
                            <p className="text-xs text-red-500 font-mono mt-1">Validation error message</p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};
