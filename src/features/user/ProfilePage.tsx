import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { ProfileView } from './components/ProfileView';
import { ProfileEdit } from './components/ProfileEdit';
import { Button } from '../../shared/ui/Button';
import { LogOut, Edit2, Home, RefreshCcw, Users, Shield, Ghost, Search, UserPlus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { SocialService, type FriendshipEdge } from '../social/SocialService';
import { FriendList, type FriendListItem } from '../social/components/FriendList';
import { ConnectButton } from '../social/components/ConnectButton';
import { supabase } from '../../shared/config/supabase';
import { SchematicAvatar } from '../../shared/ui/SchematicAvatar';

type TabOption = 'overview' | 'network';

interface DirectoryProfile {
    id: string;
    fullName: string;
    role?: string | null;
    bio?: string | null;
    xp?: number | null;
    isIncognito?: boolean | null;
}

interface DirectoryEntry extends DirectoryProfile {
    status: 'idle' | 'pending' | 'connected';
    meta?: string;
    friendshipId?: string;
}

export const ProfilePage = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabOption>('overview');
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [friendships, setFriendships] = useState<FriendshipEdge[]>([]);
    const [directory, setDirectory] = useState<DirectoryProfile[]>([]);
    const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);
    const [actionId, setActionId] = useState<string | null>(null);
    const [networkError, setNetworkError] = useState<string | null>(null);
    const [discoveryQuery, setDiscoveryQuery] = useState('');
    const [discoveryResults, setDiscoveryResults] = useState<DirectoryProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [filterQuery, setFilterQuery] = useState('');
    const [visibleConnections, setVisibleConnections] = useState(10);

    const xp = user?.xp ?? 0;
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    const currentLevelXp = 100 * Math.pow(level - 1, 2);
    const nextLevelXp = 100 * Math.pow(level, 2);
    const progress = Math.min(1, Math.max(0, (xp - currentLevelXp) / Math.max(1, nextLevelXp - currentLevelXp)));

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const refreshNetwork = useCallback(async () => {
        const userId = user?.id;
        if (!userId) return;

        setIsLoadingNetwork(true);
        setNetworkError(null);

        try {
            const [edges, directoryRes] = await Promise.all([
                SocialService.listFriendships(userId),
                supabase
                    .from('profiles')
                    .select('id, full_name, role, bio, xp, is_incognito')
                    .neq('id', userId)
                    .order('updated_at', { ascending: false })
                    .limit(20),
            ]);

            if (directoryRes.error) throw directoryRes.error;

            setFriendships(edges);
            setDirectory(
                (directoryRes.data || []).map((row) => ({
                    id: row.id,
                    fullName: row.full_name,
                    role: row.role,
                    bio: row.bio,
                    xp: row.xp,
                    isIncognito: row.is_incognito,
                }))
            );
        } catch (error) {
            setNetworkError(error instanceof Error ? error.message : 'Failed to load network data.');
        } finally {
            setIsLoadingNetwork(false);
        }
    }, [user?.id]);

    useEffect(() => {
        refreshNetwork();
    }, [refreshNetwork]);

    const handleAccept = useCallback(async (friendshipId: string) => {
        setActionId(friendshipId);
        setNetworkError(null);
        try {
            await SocialService.acceptFriendRequest(friendshipId);
            await refreshNetwork();
        } catch (error) {
            setNetworkError(error instanceof Error ? error.message : 'Unable to accept request.');
        } finally {
            setActionId(null);
        }
    }, [refreshNetwork]);

    const handleReject = useCallback(async (friendshipId: string) => {
        setActionId(friendshipId);
        setNetworkError(null);
        try {
            await SocialService.rejectFriendRequest(friendshipId);
            await refreshNetwork();
        } catch (error) {
            setNetworkError(error instanceof Error ? error.message : 'Unable to reject request.');
        } finally {
            setActionId(null);
        }
    }, [refreshNetwork]);

    const handleSendRequest = useCallback(async (targetId: string) => {
        if (!user) return;
        setActionId(targetId);
        setNetworkError(null);
        try {
            const result = await SocialService.sendFriendRequest(user.id, targetId);
            if ('alreadyRequested' in result) {
                setNetworkError('A request is already pending with this user.');
            }
            await refreshNetwork();
        } catch (error) {
            setNetworkError(error instanceof Error ? error.message : 'Unable to send request.');
        } finally {
            setActionId(null);
        }
    }, [refreshNetwork, user]);

    const acceptedFriends: FriendListItem[] = useMemo(() => {
        if (!user) return [];
        return friendships
            .filter((edge) => edge.status === 'accepted')
            .map((edge) => {
                const profile = edge.requesterId === user.id ? edge.receiver : edge.requester;
                return {
                    id: profile?.id || edge.id,
                    name: profile?.fullName || 'Unknown User',
                    role: profile?.role,
                    bio: profile?.bio,
                    status: 'accepted',
                    meta: 'Connected',
                };
            });
    }, [friendships, user]);

    const incomingRequests: FriendListItem[] = useMemo(() => {
        if (!user) return [];
        return friendships
            .filter((edge) => edge.status === 'pending' && edge.receiverId === user.id)
            .map((edge) => {
                const profile = edge.requester;
                return {
                    id: profile?.id || edge.id,
                    name: profile?.fullName || 'Unknown User',
                    role: profile?.role,
                    bio: profile?.bio,
                    status: 'pending',
                    meta: 'Incoming request',
                    onAccept: () => handleAccept(edge.id),
                    onReject: () => handleReject(edge.id),
                };
            });
    }, [friendships, handleAccept, handleReject, user]);

    const outgoingRequests: FriendListItem[] = useMemo(() => {
        if (!user) return [];
        return friendships
            .filter((edge) => edge.status === 'pending' && edge.requesterId === user.id)
            .map((edge) => {
                const profile = edge.receiver;
                return {
                    id: profile?.id || edge.id,
                    name: profile?.fullName || 'Unknown User',
                    role: profile?.role,
                    bio: profile?.bio,
                    status: 'pending',
                    meta: 'Awaiting response',
                };
            });
    }, [friendships, user]);

    const buildDirectoryEntry = useCallback(
        (profile: DirectoryProfile): DirectoryEntry => {
            const edge = friendships.find(
                (f) =>
                    (f.requesterId === profile.id && f.receiverId === user?.id) ||
                    (f.receiverId === profile.id && f.requesterId === user?.id)
            );

            let status: DirectoryEntry['status'] = 'idle';
            let meta: string | undefined;

            if (edge) {
                if (edge.status === 'accepted') {
                    status = 'connected';
                    meta = 'Connected';
                } else if (edge.status === 'pending') {
                    status = 'pending';
                    meta = edge.receiverId === user?.id ? 'Incoming request' : 'Request sent';
                } else if (edge.status === 'rejected') {
                    status = 'idle';
                    meta = 'Previously rejected';
                }
            }

            return { ...profile, status, meta, friendshipId: edge?.id };
        },
        [friendships, user?.id]
    );

    const runDiscoverySearch = useCallback(
        async (term: string) => {
            if (!user?.id) return [];
            const cleaned = term.trim();
            if (cleaned.length < 2) {
                setDiscoveryResults([]);
                return [];
            }
            const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            const orFilters = [`full_name.ilike.%${cleaned}%`];
            if (isUuid.test(cleaned)) {
                orFilters.push(`id.eq.${cleaned}`);
            }
            setIsSearching(true);
            setNetworkError(null);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, role, bio, xp, is_incognito')
                    .neq('id', user.id)
                    .or(orFilters.join(','))
                    .order('updated_at', { ascending: false })
                    .limit(10);

                if (error) throw error;

                const mapped = (data || []).map((row) => ({
                    id: row.id,
                    fullName: row.full_name,
                    role: row.role,
                    bio: row.bio,
                    xp: row.xp,
                    isIncognito: row.is_incognito,
                }));
                setDiscoveryResults(mapped);
                return mapped;
            } catch (error) {
                setNetworkError(error instanceof Error ? error.message : 'Unable to search directory.');
                return [];
            } finally {
                setIsSearching(false);
            }
        },
        [user?.id]
    );

    useEffect(() => {
        const handle = setTimeout(() => {
            if (discoveryQuery.trim().length >= 2) {
                void runDiscoverySearch(discoveryQuery);
            } else {
                setDiscoveryResults([]);
            }
        }, 250);

        return () => clearTimeout(handle);
    }, [discoveryQuery, runDiscoverySearch]);

    const discoveryEntries: DirectoryEntry[] = useMemo(() => {
        const hasQuery = discoveryQuery.trim().length >= 2;
        const source = hasQuery ? discoveryResults : directory.slice(0, 8);
        return source.map(buildDirectoryEntry);
    }, [buildDirectoryEntry, directory, discoveryQuery, discoveryResults]);

    const filteredConnections = useMemo(() => {
        const q = filterQuery.trim().toLowerCase();
        if (!q) return acceptedFriends;
        return acceptedFriends.filter((friend) => friend.name.toLowerCase().includes(q));
    }, [acceptedFriends, filterQuery]);

    const connectionsToShow = filteredConnections.slice(0, visibleConnections);

    const connectionCount = acceptedFriends.length;
    const hasMoreConnections = filteredConnections.length > visibleConnections;
    const pendingRequestsCount = incomingRequests.length;

    const switchTab = (tab: TabOption) => {
        setActiveTab(tab);
        if (tab === 'network') {
            setIsEditing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="max-w-5xl mx-auto relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 bg-white border border-gray-200 rounded-md hover:border-black transition-colors group">
                            <Home className="w-5 h-5 text-gray-500 group-hover:text-black" />
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
                    </div>
                    <div className="flex gap-4">
                        {activeTab === 'overview' && !isEditing && (
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

                {user && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-white border border-gray-200">
                            <p className="text-xs font-mono text-gray-500 uppercase">System Level</p>
                            <div className="text-2xl font-bold tracking-tight">v{level}.0</div>
                        </div>
                        <div className="p-4 bg-white border border-gray-200">
                            <div className="flex items-center justify-between text-xs font-mono uppercase text-gray-500">
                                <span>XP</span>
                                <span>{xp} XP</span>
                            </div>
                            <div className="mt-2 h-2 bg-gray-100 border border-gray-200">
                                <div
                                    className="h-full bg-black transition-all duration-300"
                                    style={{ width: `${Math.round(progress * 100)}%` }}
                                />
                            </div>
                            <p className="mt-1 text-[11px] text-gray-500 font-mono">
                                Next upgrade at {nextLevelXp} XP
                            </p>
                        </div>
                        <div className="p-4 bg-white border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-gray-500" />
                                    <p className="text-xs font-mono text-gray-500 uppercase">Privacy</p>
                                </div>
                                {user.isIncognito && <Ghost className="w-4 h-4 text-gray-700" />}
                            </div>
                            <p className="text-sm font-semibold mt-2">
                                {user.isIncognito ? 'Stealth Mode Enabled' : 'Visible to your network'}
                            </p>
                            <p className="text-xs text-gray-500 font-mono uppercase mt-1">Connections: {connectionCount}</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => switchTab('overview')}
                        className={`pb-3 px-1 text-sm font-semibold uppercase tracking-wider ${activeTab === 'overview' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => switchTab('network')}
                        className={`pb-3 px-1 text-sm font-semibold uppercase tracking-wider ${activeTab === 'network' ? 'border-b-2 border-black text-black' : 'text-gray-500'}`}
                    >
                        Network
                    </button>
                </div>

                {activeTab === 'overview' ? (
                    isEditing ? (
                        <ProfileEdit onCancel={() => setIsEditing(false)} onSave={() => setIsEditing(false)} />
                    ) : (
                        <ProfileView />
                    )
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-lg font-bold">Your Network</p>
                                    <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">Manage friend requests and connections</p>
                                </div>
                                <Button variant="outline" onClick={refreshNetwork} disabled={isLoadingNetwork} className="flex items-center gap-2">
                                    <RefreshCcw className="w-4 h-4" />
                                    {isLoadingNetwork ? 'Refreshing...' : 'Refresh'}
                                </Button>
                            </div>

                            {networkError && (
                                <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2">
                                    {networkError}
                                </div>
                            )}

                            {isLoadingNetwork ? (
                                <div className="text-sm text-gray-500">Loading network...</div>
                            ) : (
                                <div className="space-y-6">
                                    {pendingRequestsCount > 0 && (
                                        <div className="border border-dashed border-amber-300 bg-amber-50 p-4">
                                            <FriendList
                                                title="Incoming Requests"
                                                items={incomingRequests}
                                                emptyLabel="No incoming requests."
                                                variant="pending"
                                            />
                                        </div>
                                    )}

                                    <div className="border border-gray-200 bg-gray-50 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold">Discovery</p>
                                                <p className="text-[11px] text-gray-500 font-mono uppercase">Find new people</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono uppercase">
                                                <Users className="w-4 h-4" />
                                                <span>{discoveryEntries.length} suggestions</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <div className="flex-1 relative">
                                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    value={discoveryQuery}
                                                    onChange={(e) => setDiscoveryQuery(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-sm p-2 pl-9 text-sm font-mono outline-none focus:border-black"
                                                    placeholder="Enter User ID or Name to connect..."
                                                />
                                            </div>
                                            <Button
                                                onClick={async () => {
                                                    const results = await runDiscoverySearch(discoveryQuery);
                                                    if (results.length === 1) {
                                                        await handleSendRequest(results[0].id);
                                                    }
                                                }}
                                                disabled={discoveryQuery.trim().length < 2 || isSearching}
                                                className="flex items-center gap-2"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                {isSearching ? 'Searching...' : 'Send Request'}
                                            </Button>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-mono uppercase">
                                            Type 2+ letters to see live suggestions.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {discoveryEntries.map((profile) => (
                                                <div key={profile.id} className="border border-white bg-white p-3 flex flex-col gap-2 shadow-[2px_2px_0px_rgba(0,0,0,0.05)]">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold">{profile.fullName}</p>
                                                            {profile.role && <p className="text-[11px] font-mono uppercase text-gray-500">{profile.role}</p>}
                                                            {profile.bio && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{profile.bio}</p>}
                                                        </div>
                                                        <ConnectButton
                                                            status={profile.status}
                                                            disabled={actionId === profile.id || isLoadingNetwork || isSearching}
                                                            onAdd={() => handleSendRequest(profile.id)}
                                                        />
                                                    </div>
                                                    {profile.meta && (
                                                        <p className="text-[11px] text-gray-500 font-mono uppercase">
                                                            {profile.meta}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                            {discoveryEntries.length === 0 && (
                                                <div className="border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                                                    Start typing to discover people.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 bg-gray-50 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold">Connections ({filteredConnections.length})</p>
                                                <p className="text-[11px] text-gray-500 font-mono uppercase">Filter and manage your registry</p>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                value={filterQuery}
                                                onChange={(e) => {
                                                    setFilterQuery(e.target.value);
                                                    setVisibleConnections(10);
                                                }}
                                                className="w-full border border-gray-300 rounded-sm p-2 pl-9 text-sm font-mono outline-none focus:border-black"
                                                placeholder="Filter by name..."
                                            />
                                        </div>
                                        <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                                            {connectionsToShow.length === 0 ? (
                                                <div className="border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
                                                    {filterQuery ? 'No matches found.' : 'No friends connected yet.'}
                                                </div>
                                            ) : (
                                                connectionsToShow.map((item) => (
                                                    <div key={item.id} className="border border-gray-200 bg-white p-3 flex items-center gap-3 shadow-[2px_2px_0px_rgba(0,0,0,0.05)]">
                                                        <SchematicAvatar seed={item.id} size={48} className="border border-gray-300" />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="font-semibold">{item.name}</p>
                                                                    {item.role && (
                                                                        <p className="text-[11px] font-mono uppercase text-gray-500">{item.role}</p>
                                                                    )}
                                                                </div>
                                                                <span className="px-2 py-0.5 text-[11px] font-mono uppercase border border-green-200 bg-green-50 text-green-700">
                                                                    {item.status}
                                                                </span>
                                                            </div>
                                                            {item.bio && <p className="text-sm text-gray-600">{item.bio}</p>}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {hasMoreConnections && (
                                            <div className="flex justify-center">
                                                <Button variant="outline" onClick={() => setVisibleConnections((prev) => prev + 10)}>
                                                    Load More
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <FriendList title="Outgoing Requests" items={outgoingRequests} emptyLabel="No outgoing requests." />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
