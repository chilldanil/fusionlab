import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { supabase } from '../config/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    role: 'user' | 'admin';
    bio?: string;
    skills?: string[];
    xp: number;
    isIncognito: boolean;
}

interface AuthContextType {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (authUser: SupabaseUser) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                // Fallback if profile doesn't exist yet (race condition with trigger)
                setUser({
                    id: authUser.id,
                    email: authUser.email!,
                    fullName: authUser.user_metadata.full_name || 'User',
                    role: 'user',
                    xp: 0,
                    isIncognito: false,
                });
            } else if (data) {
                setUser({
                    id: data.id,
                    email: authUser.email!,
                    fullName: data.full_name,
                    role: data.role || 'user',
                    bio: data.bio,
                    skills: data.skills,
                    xp: data.xp ?? 0,
                    isIncognito: data.is_incognito ?? false,
                });
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
    };

    const register = async (email: string, password: string, fullName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        });
        if (error) throw error;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
    };

    const updateProfile = async (data: Partial<UserProfile>) => {
        if (!user) return;

        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (data.fullName !== undefined) updates.full_name = data.fullName;
        if (data.bio !== undefined) updates.bio = data.bio;
        if (data.skills !== undefined) updates.skills = data.skills;
        if (data.isIncognito !== undefined) updates.is_incognito = data.isIncognito;
        if (data.xp !== undefined) updates.xp = data.xp;

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;

        // Optimistic update
        setUser({ ...user, ...data });
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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
