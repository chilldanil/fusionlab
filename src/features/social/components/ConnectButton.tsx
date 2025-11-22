type ConnectState = 'idle' | 'pending' | 'connected';

interface ConnectButtonProps {
    status: ConnectState;
    onAdd?: () => void;
    disabled?: boolean;
}

const labels: Record<ConnectState, string> = {
    idle: 'Add',
    pending: 'Pending',
    connected: 'Connected',
};

const styles: Record<ConnectState, string> = {
    idle: 'bg-black text-white hover:bg-gray-800 border border-transparent',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed',
    connected: 'bg-green-50 text-green-700 border border-green-200 cursor-not-allowed',
};

export const ConnectButton = ({ status, onAdd, disabled }: ConnectButtonProps) => {
    const isDisabled = status !== 'idle' || disabled;

    return (
        <button
            onClick={status === 'idle' ? onAdd : undefined}
            disabled={isDisabled}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${styles[status]} ${isDisabled ? 'opacity-80' : 'active:scale-95'}`}
        >
            {labels[status]}
        </button>
    );
};
