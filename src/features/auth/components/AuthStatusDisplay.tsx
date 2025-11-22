import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import { Button } from '../../../shared/ui/Button';
import { LogOut, User } from 'lucide-react';

export const AuthStatusDisplay = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    if (isAuthenticated && user) {
        return (
            <div className="flex items-center gap-4">
                <Link
                    to="/profile"
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors group"
                >
                    <div className="p-1 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                        <User className="w-4 h-4" />
                    </div>
                    <span className="font-mono">{user.fullName}</span>
                </Link>
                <div className="h-4 w-px bg-gray-200" />
                <button
                    onClick={handleLogout}
                    className="text-xs font-mono text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                    <LogOut className="w-3 h-3" />
                    LOGOUT
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-8 text-sm font-medium text-gray-600">
            <Link to="/login" className="hover:text-black transition-colors">Login</Link>
            <Button variant="primary" onClick={handleLogin} className="text-xs px-4 py-1.5">
                Sign In
            </Button>
        </div>
    );
};
