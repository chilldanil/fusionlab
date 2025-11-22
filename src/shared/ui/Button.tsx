import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline';
    children: ReactNode;
}

export const Button = ({
    variant = 'primary',
    className,
    children,
    ...props
}: ButtonProps) => {
    const baseStyles = "px-6 py-2 rounded-md font-medium transition-all duration-200 active:scale-95";

    const variants = {
        primary: "bg-black text-white hover:bg-gray-800 border border-transparent",
        outline: "bg-transparent text-black border border-black hover:bg-gray-100"
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], className)}
            {...props}
        >
            {children}
        </button>
    );
};
