import { useAuth } from '../../../shared/context/AuthContext';
import { Mail, Shield, Code, FileText } from 'lucide-react';

export const ProfileView = () => {
    const { user } = useAuth();

    if (!user) return null;

    const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
        <div className="mb-8 last:mb-0">
            <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                <Icon className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">{title}</h3>
            </div>
            {children}
        </div>
    );

    return (
        <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-1">{user.fullName}</h1>
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-mono text-gray-500 uppercase">Active Session</span>
                    </div>
                </div>
                <div className="px-3 py-1 bg-gray-100 border border-gray-200 text-xs font-mono uppercase tracking-wider">
                    {user.role}
                </div>
            </div>

            <Section title="Contact Information" icon={Mail}>
                <div className="font-mono text-sm">{user.email}</div>
            </Section>

            <Section title="Bio" icon={FileText}>
                <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
                    {user.bio || "No bio provided."}
                </p>
            </Section>

            <Section title="Skills & Competencies" icon={Code}>
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
            </Section>

            <Section title="System ID" icon={Shield}>
                <code className="bg-gray-50 px-2 py-1 text-xs font-mono text-gray-400 border border-gray-100 rounded-sm">
                    {user.id}
                </code>
            </Section>
        </div>
    );
};
