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
    idle: 'bg-black text-white hover:bg-gray-800 border border-black',
    pending: 'bg-transparent text-gray-500 border border-dashed border-gray-400 cursor-not-allowed',
    connected: 'bg-gray-100 text-gray-800 border border-gray-200 font-medium cursor-default',
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
