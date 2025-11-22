import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/ui/Button';
import { Navbar } from './components/Navbar';

export const LandingPage = () => {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-hidden relative">
            {/* Grid Background */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

            <Navbar />

            {/* Hero Section */}
            <main className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-4xl"
                >
                    <div className="inline-block mb-6 px-3 py-1 border border-gray-200 rounded-full text-xs font-mono text-gray-500 uppercase tracking-widest">
                        v2.0 System Architecture
                    </div>

                    <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.9] mb-8">
                        ENGINEERING <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
                            THE FUTURE
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mb-12 font-light leading-relaxed">
                        A precision-engineered workspace for creators, innovators, and builders.
                        Designed for the next generation of technical excellence.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Button onClick={handleLogin} className="h-12 px-8 text-lg">
                            Access Portal
                        </Button>
                        <Button variant="outline" onClick={handleLogin} className="h-12 px-8 text-lg">
                            Documentation
                        </Button>
                    </div>
                </motion.div>

                {/* Abstract Decorative Elements */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-1/2 hidden lg:block pointer-events-none"
                >
                    <div className="w-full h-full border border-gray-100 relative">
                        <div className="absolute top-0 right-0 w-20 h-20 border-b border-l border-gray-200" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 border-t border-r border-gray-200" />
                        <div className="absolute inset-10 border border-dashed border-gray-100 rounded-full opacity-50" />
                    </div>
                </motion.div>
            </main>
        </div>
    );
};
