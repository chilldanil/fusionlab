import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../shared/context/AuthContext';
import { Button } from '../../../shared/ui/Button';
import { useState } from 'react';
import { X } from 'lucide-react';
import { SchematicAvatar } from '../../../shared/ui/SchematicAvatar';

const ProfileSchema = z.object({
    fullName: z.string().min(2, 'Full name is required'),
    bio: z.string().optional(),
    isIncognito: z.boolean(),
});

type ProfileFormData = z.infer<typeof ProfileSchema>;

interface ProfileEditProps {
    onCancel: () => void;
    onSave: () => void;
}

export const ProfileEdit = ({ onCancel, onSave }: ProfileEditProps) => {
    const { user, updateProfile } = useAuth();
    const [skills, setSkills] = useState<string[]>(user?.skills || []);
    const [newSkill, setNewSkill] = useState('');

    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
        resolver: zodResolver(ProfileSchema),
        defaultValues: {
            fullName: user?.fullName || '',
            bio: user?.bio || '',
            isIncognito: user?.isIncognito ?? false,
        }
    });

    const watchedFullName = useWatch({
        control,
        name: 'fullName',
        defaultValue: user?.fullName || ''
    });
    const watchedIncognito = useWatch({
        control,
        name: 'isIncognito',
        defaultValue: user?.isIncognito ?? false,
    });

    const onSubmit = async (data: ProfileFormData) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        updateProfile({ ...data, skills });
        onSave();
    };

    const addSkill = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newSkill.trim()) {
            e.preventDefault();
            if (!skills.includes(newSkill.trim())) {
                setSkills([...skills, newSkill.trim()]);
            }
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const inputClasses = "w-full bg-transparent border border-gray-300 focus:border-black rounded-sm p-2 outline-none transition-colors font-mono text-sm";
    const labelClasses = "block text-xs font-mono text-gray-500 mb-1 uppercase tracking-wider";
    const errorClasses = "text-xs text-red-500 font-mono mt-1";

    return (
        <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                <SchematicAvatar seed={watchedFullName || 'placeholder'} size={80} />
                <div>
                    <h2 className="text-xl font-bold">Edit Profile</h2>
                    <p className="text-sm text-gray-500">Avatar updates automatically based on your name.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <label className={labelClasses}>Full Name</label>
                    <input
                        {...register('fullName')}
                        className={inputClasses}
                    />
                    {errors.fullName && (
                        <p className={errorClasses}>{errors.fullName.message}</p>
                    )}
                </div>

                <div>
                    <label className={labelClasses}>Bio</label>
                    <textarea
                        {...register('bio')}
                        className={`${inputClasses} min-h-[100px] resize-y`}
                        placeholder="Tell us about yourself..."
                    />
                </div>

                <div>
                    <label className={labelClasses}>Skills (Press Enter to add)</label>
                    <input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={addSkill}
                        className={inputClasses}
                        placeholder="React, TypeScript, Design..."
                    />
                    <div className="flex flex-wrap gap-2 mt-3">
                        {skills.map(skill => (
                            <span key={skill} className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 text-xs font-mono text-gray-700">
                                {skill}
                                <button
                                    type="button"
                                    onClick={() => removeSkill(skill)}
                                    className="hover:text-red-500"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold">Stealth Mode</p>
                            <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                                Hide presence and activity from everyone.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('isIncognito')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-black transition-colors"></div>
                            <div
                                className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white border border-gray-300 rounded-full transition-all ${watchedIncognito ? 'translate-x-5 border-black' : ''}`}
                            />
                        </label>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
};
