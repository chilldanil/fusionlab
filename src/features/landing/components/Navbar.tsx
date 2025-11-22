import { Link } from 'react-router-dom';
import { AuthStatusDisplay } from '../../auth/components/AuthStatusDisplay';

export const Navbar = () => {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="font-mono text-lg font-bold tracking-tighter hover:opacity-70 transition-opacity">
                    TUM MAKERSPACE
                </Link>

                <div className="hidden md:flex items-center space-x-8">
                    <Link to="/" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Main</Link>
                    <AuthStatusDisplay />
                </div>
            </div>
        </nav>
    );
};
