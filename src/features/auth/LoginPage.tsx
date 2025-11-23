import { Link } from 'react-router-dom';
import { AuthForm } from './components/AuthForm';
import { AnimatedCircuitBackground } from '../landing/components/AnimatedCircuitBackground';

export const LoginPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden">
            {/* Grid Background */}
            <AnimatedCircuitBackground />

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="mb-8 text-center">
                    <Link to="/" className="inline-block font-mono text-2xl font-bold tracking-tighter mb-2 hover:opacity-70 transition-opacity">
                        TUM MAKERSPACE
                    </Link>
                    <p className="text-gray-500 text-sm font-mono uppercase tracking-widest">Authentication Portal</p>
                </div>

                <AuthForm />

                <div className="mt-8 text-center">
                    <Link to="/" className="text-xs font-mono text-gray-400 hover:text-black transition-colors border-b border-transparent hover:border-black pb-0.5">
                        ← Return to Main Terminal
                    </Link>
                </div>
            </div>
        </div>
    );
};
