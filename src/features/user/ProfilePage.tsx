import { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { ProfileView } from './components/ProfileView';
import { ProfileEdit } from './components/ProfileEdit';
import { Button } from '../../shared/ui/Button';
import { LogOut, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
    const [isEditing, setIsEditing] = useState(false);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
            {/* Grid Background */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="max-w-3xl mx-auto relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
                    <div className="flex gap-4">
                        {!isEditing && (
                            <Button variant="outline" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                                <Edit2 className="w-4 h-4" />
                                Edit Profile
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                            <LogOut className="w-4 h-4" />
                            Logout
                        </Button>
                    </div>
                </div>

                {isEditing ? (
                    <ProfileEdit onCancel={() => setIsEditing(false)} onSave={() => setIsEditing(false)} />
                ) : (
                    <ProfileView />
                )}
            </div>
        </div>
    );
};
