import { Button } from '../../../shared/ui/Button';
import { SchematicAvatar } from '../../../shared/ui/SchematicAvatar';
import type { FriendshipStatus } from '../SocialService';

export interface FriendListItem {
    id: string;
    name: string;
    role?: string | null;
    bio?: string | null;
    status: FriendshipStatus;
    meta?: string;
    onAccept?: () => void;
    onReject?: () => void;
}

interface FriendListProps {
    title: string;
    items: FriendListItem[];
    emptyLabel?: string;
    variant?: 'default' | 'pending';
}

const statusClasses: Record<FriendshipStatus, string> = {
    accepted: 'bg-gray-100 text-gray-600 border border-gray-200',
    pending: 'border border-black border-dashed text-black bg-transparent',
    rejected: 'border border-red-200 bg-red-50 text-red-700',
};

export const FriendList = ({ title, items, emptyLabel = 'No connections yet.', variant = 'default' }: FriendListProps) => {
    const wrapperBorder = variant === 'pending' ? 'border-dashed border-black bg-transparent' : 'border-gray-200 bg-white';

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">{title}</h3>
                <span className="text-[11px] font-mono text-gray-400">{items.length} entries</span>
            </div>

            {items.length === 0 ? (
                <div className="border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                    {emptyLabel}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`border p-4 flex gap-3 shadow-[3px_3px_0px_rgba(0,0,0,0.05)] ${wrapperBorder}`}
                        >
                            <SchematicAvatar seed={item.id} size={48} className="border border-gray-300" />
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-semibold">{item.name}</div>
                                        {item.role && <p className="text-[11px] font-mono uppercase text-gray-500">{item.role}</p>}
                                    </div>
                                    <span className={`px-2 py-0.5 text-[11px] font-mono uppercase border ${statusClasses[item.status]}`}>
                                        {item.status}
                                    </span>
                                </div>
                                {item.meta && (
                                    <p className="text-[11px] text-gray-500 font-mono uppercase mt-1">
                                        {item.meta}
                                    </p>
                                )}
                                {item.bio && <p className="text-sm text-gray-600 mt-1">{item.bio}</p>}
                                {(item.onAccept || item.onReject) && (
                                    <div className="mt-3 flex gap-2">
                                        {item.onReject && (
                                            <Button variant="outline" onClick={item.onReject} className="flex-1 border-gray-300">
                                                Reject
                                            </Button>
                                        )}
                                        {item.onAccept && (
                                            <Button onClick={item.onAccept} className="flex-1">
                                                Accept
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
