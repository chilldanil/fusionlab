import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArcadeContainer, GAME_METADATA, GAME_REGISTRY } from '../../arcade';

export const Footer = () => {
    const buildingsSvg = '/3buildings.svg';
    const currentYear = new Date().getFullYear();
    const [arcadeOpen, setArcadeOpen] = useState(false);

    const footerLinks = {
        product: [
            { name: 'Features', href: '#features' },
            { name: 'Documentation', href: '/design' },
            { name: 'Events', href: '/events' },
            { name: 'Booking', href: '/booking' },
        ],
        company: [
            { name: 'About', href: '#about' },
            { name: 'Careers', href: '#careers' },
            { name: 'Contact', href: '#contact' },
            { name: 'Blog', href: '#blog' },
        ],
        legal: [
            { name: 'Privacy', href: '#privacy' },
            { name: 'Terms', href: '#terms' },
            { name: 'Security', href: '#security' },
            { name: 'Compliance', href: '#compliance' },
        ],
        social: [
            { name: 'GitHub', href: '#github' },
            { name: 'Twitter', href: '#twitter' },
            { name: 'LinkedIn', href: '#linkedin' },
            { name: 'Discord', href: '#discord' },
        ],
    };

    return (
        <footer className="relative bg-black text-white overflow-hidden">
            {/* SVG Buildings - Full-width backdrop pinned to bottom */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Gradient fade from top - content area stays readable */}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-transparent z-10" />
                
                {/* Buildings container - pinned to bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
                    <img
                        src={buildingsSvg}
                        alt=""
                        aria-hidden="true"
                        className="w-[200%] max-w-[2400px] h-auto"
                        style={{ 
                            // Invert black to white, then reduce brightness for subtle effect
                            filter: 'invert(1) brightness(0.4)',
                            opacity: 0.6,
                        }}
                    />
                </div>
                
                {/* Subtle glow at bottom */}
                <div 
                    className="absolute bottom-0 left-0 right-0 h-40 z-5"
                    style={{
                        background: 'linear-gradient(to top, rgba(255,255,255,0.02) 0%, transparent 100%)',
                    }}
                />
            </div>

            {/* Main Footer Content */}
            <div className="relative z-20 max-w-7xl mx-auto px-6">
                {/* Top Section - Large Branding */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="pt-20 pb-16 border-b border-white/10"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
                        <div>
                            <h2 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                                FUSION
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                                    LAB
                                </span>
                            </h2>
                            <p className="text-gray-400 text-lg max-w-md font-light leading-relaxed">
                                Engineering the future of collaborative workspaces.
                                Where innovation meets precision.
                            </p>
                        </div>

                        {/* CTA Section */}
                        <div className="flex flex-col items-start lg:items-end gap-4">
                            <div className="inline-block px-3 py-1 border border-white/20 rounded-full text-xs font-mono text-gray-400 uppercase tracking-widest">
                                Join the ecosystem
                            </div>
                            <a
                                href="/login"
                                className="group relative px-8 py-4 bg-white text-black font-medium rounded-sm hover:bg-gray-100 transition-colors"
                            >
                                <span className="relative z-10">Get Started →</span>
                            </a>
                        </div>
                    </div>
                </motion.div>

                {/* Links Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="py-16 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
                >
                    <div>
                        <h3 className="text-sm font-mono uppercase tracking-widest text-gray-500 mb-6">
                            Product
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors font-light"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-mono uppercase tracking-widest text-gray-500 mb-6">
                            Company
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors font-light"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-mono uppercase tracking-widest text-gray-500 mb-6">
                            Legal
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors font-light"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-mono uppercase tracking-widest text-gray-500 mb-6">
                            Social
                        </h3>
                        <ul className="space-y-3">
                            {footerLinks.social.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-gray-400 hover:text-white transition-colors font-light"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>

                {/* Bottom Section */}
                <div className="relative pb-8 pt-12 border-t border-white/10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-col md:flex-row justify-between items-center gap-6"
                    >
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300 font-mono">
                            <span>© {currentYear} FusionLab</span>
                            <span className="hidden md:inline text-gray-600">•</span>
                            <span>All rights reserved</span>
                            <span className="hidden md:inline text-gray-600">•</span>
                            <span className="text-gray-500">v2.0.0</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>All systems operational</span>
                        </div>
                    </motion.div>
                </div>

                {/* Arcade Button */}
                <div className="relative pb-8 pt-4 flex justify-center">
                    <motion.button
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        onClick={() => setArcadeOpen(true)}
                        className="group px-6 py-3 border border-white/20 hover:border-white/60 font-mono text-sm text-gray-400 hover:text-white transition-all hover:bg-white/5"
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-green-500">▶</span>
                            ARCADE
                            <span className="text-xs opacity-60">[Press to Play]</span>
                        </span>
                    </motion.button>
                </div>

                {/* Bottom padding so buildings show through */}
                <div className="h-48 md:h-64" />
            </div>

            {/* Arcade Container */}
            <ArcadeContainer
                isOpen={arcadeOpen}
                onClose={() => setArcadeOpen(false)}
                games={GAME_METADATA}
                gameRegistry={GAME_REGISTRY}
            />
        </footer>
    );
};