import { useAuth } from '../../../shared/context/AuthContext';
import { Mail, Shield, Code, FileText, Ghost, type LucideIcon } from 'lucide-react';
import { SchematicAvatar } from '../../../shared/ui/SchematicAvatar';
import type { ReactNode } from 'react';

const ProfileSection = ({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) => (
    <div className="mb-8 last:mb-0">
        <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
            <Icon className="w-4 h-4 text-gray-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">{title}</h3>
        </div>
        {children}
    </div>
);

export const ProfileView = () => {
    const { user } = useAuth();

    if (!user) return null;

    const xp = user.xp ?? 0;
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    const currentLevelXp = 100 * Math.pow(level - 1, 2);
    const nextLevelXp = 100 * Math.pow(level, 2);
    const progress = Math.min(1, Math.max(0, (xp - currentLevelXp) / Math.max(1, nextLevelXp - currentLevelXp)));

    return (
        <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-start gap-6 mb-8">
                <div className="relative shrink-0">
                    <SchematicAvatar seed={user.email} size={100} />
                    {user.isIncognito && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <Ghost className="w-4 h-4" />
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">{user.fullName}</h1>
                            <div className="flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${user.isIncognito ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`}></span>
                                <span className="text-xs font-mono text-gray-500 uppercase">
                                    {user.isIncognito ? 'Stealth Mode' : 'Active Session'}
                                </span>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-gray-100 border border-gray-200 text-xs font-mono uppercase tracking-wider">
                            {user.role}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        <div className="p-3 bg-gray-50 border border-gray-200">
                            <p className="text-xs font-mono text-gray-500 uppercase">System Level</p>
                            <div className="text-2xl font-bold tracking-tight">v{level}.0</div>
                        </div>
                        <div className="p-3 bg-gray-50 border border-gray-200">
                            <div className="flex items-center justify-between text-xs font-mono text-gray-500 uppercase">
                                <span>XP Progress</span>
                                <span>{xp} XP</span>
                            </div>
                            <div className="mt-2 h-2 bg-white border border-gray-200">
                                <div
                                    className="h-full bg-black transition-all duration-300"
                                    style={{ width: `${Math.round(progress * 100)}%` }}
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-gray-500 font-mono">
                                Next upgrade at {nextLevelXp} XP
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ProfileSection title="Contact Information" icon={Mail}>
                <div className="font-mono text-sm">{user.email}</div>
            </ProfileSection>

            <ProfileSection title="Bio" icon={FileText}>
                <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                    {user.bio || "No bio provided."}
                </p>
            </ProfileSection>

            <ProfileSection title="Skills & Competencies" icon={Code}>
                <div className="flex flex-wrap gap-2">
                    {user.skills && user.skills.length > 0 ? (
                        user.skills.map((skill) => (
                            <span key={skill} className="px-2 py-1 bg-gray-50 border border-gray-200 text-xs font-mono text-gray-600">
                                {skill}
                            </span>
                        ))
                    ) : (
                        <span className="text-sm text-gray-400 italic">No skills listed</span>
                    )}
                </div>
            </ProfileSection>

            <ProfileSection title="System ID" icon={Shield}>
                <code className="bg-gray-50 px-2 py-1 text-xs font-mono text-gray-400 border border-gray-100 rounded-sm">
                    {user.id}
                </code>
            </ProfileSection>
        </div>
    );
};
