import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'user' | 'admin';
    bio?: string;
    skills?: string[];
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Simulate checking session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('mock_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockUser: User = {
            id: '1',
            email,
            fullName: 'Test Engineer',
            role: 'user',
            bio: 'Full Stack Developer passionate about clean code and architecture.',
            skills: ['React', 'TypeScript', 'Node.js']
        };

        setUser(mockUser);
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
    };

    const register = async (email: string, _password: string, fullName: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockUser: User = {
            id: '1',
            email,
            fullName,
            role: 'user',
            bio: 'New Member',
            skills: []
        };

        setUser(mockUser);
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mock_user');
    };

    const updateProfile = (data: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('mock_user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            register,
            logout,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
