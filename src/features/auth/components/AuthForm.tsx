import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../../shared/context/AuthContext';
import { LoginSchema, RegisterSchema, type LoginFormData, type RegisterFormData } from '../types';
import { Button } from '../../../shared/ui/Button';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

export const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const loginForm = useForm<LoginFormData>({
        resolver: zodResolver(LoginSchema),
    });

    const registerForm = useForm<RegisterFormData>({
        resolver: zodResolver(RegisterSchema),
    });

    const onLoginSubmit = async (data: LoginFormData) => {
        try {
            setError(null);
            await login(data.email, data.password);
            navigate('/profile');
        } catch (err) {
            setError('Login failed. Please try again.');
        }
    };

    const onRegisterSubmit = async (data: RegisterFormData) => {
        try {
            setError(null);
            await register(data.email, data.password, data.fullName);
            navigate('/profile');
        } catch (err) {
            setError('Registration failed. Please try again.');
        }
    };

    const inputClasses = "w-full bg-transparent border border-gray-300 focus:border-black rounded-sm p-2 outline-none transition-colors font-mono text-sm";
    const labelClasses = "block text-xs font-mono text-gray-500 mb-1 uppercase tracking-wider";
    const errorClasses = "text-xs text-red-500 font-mono mt-1";

    return (
        <div className="w-full max-w-md bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* Tabs */}
            <div className="flex border-b border-black">
                <button
                    onClick={() => setIsLogin(true)}
                    className={clsx(
                        "flex-1 py-3 text-sm font-mono font-bold uppercase tracking-wider transition-colors",
                        isLogin ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"
                    )}
                >
                    Login
                </button>
                <button
                    onClick={() => setIsLogin(false)}
                    className={clsx(
                        "flex-1 py-3 text-sm font-mono font-bold uppercase tracking-wider transition-colors",
                        !isLogin ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50"
                    )}
                >
                    Sign Up
                </button>
            </div>

            <div className="p-8">
                {error && (
                    <div className="mb-6 p-3 border border-red-500 bg-red-50 text-red-600 text-xs font-mono">
                        {error}
                    </div>
                )}

                {isLogin ? (
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                        <div>
                            <label className={labelClasses}>Email</label>
                            <input
                                {...loginForm.register('email')}
                                type="email"
                                className={inputClasses}
                                placeholder="user@example.com"
                            />
                            {loginForm.formState.errors.email && (
                                <p className={errorClasses}>{loginForm.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className={labelClasses}>Password</label>
                            <input
                                {...loginForm.register('password')}
                                type="password"
                                className={inputClasses}
                                placeholder="••••••"
                            />
                            {loginForm.formState.errors.password && (
                                <p className={errorClasses}>{loginForm.formState.errors.password.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full rounded-none h-12 text-sm uppercase tracking-widest" disabled={loginForm.formState.isSubmitting}>
                            {loginForm.formState.isSubmitting ? 'Authenticating...' : 'Access System'}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                        <div>
                            <label className={labelClasses}>Full Name</label>
                            <input
                                {...registerForm.register('fullName')}
                                type="text"
                                className={inputClasses}
                                placeholder="John Doe"
                            />
                            {registerForm.formState.errors.fullName && (
                                <p className={errorClasses}>{registerForm.formState.errors.fullName.message}</p>
                            )}
                        </div>

                        <div>
                            <label className={labelClasses}>Email</label>
                            <input
                                {...registerForm.register('email')}
                                type="email"
                                className={inputClasses}
                                placeholder="user@example.com"
                            />
                            {registerForm.formState.errors.email && (
                                <p className={errorClasses}>{registerForm.formState.errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className={labelClasses}>Password</label>
                            <input
                                {...registerForm.register('password')}
                                type="password"
                                className={inputClasses}
                                placeholder="••••••"
                            />
                            {registerForm.formState.errors.password && (
                                <p className={errorClasses}>{registerForm.formState.errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className={labelClasses}>Confirm Password</label>
                            <input
                                {...registerForm.register('confirmPassword')}
                                type="password"
                                className={inputClasses}
                                placeholder="••••••"
                            />
                            {registerForm.formState.errors.confirmPassword && (
                                <p className={errorClasses}>{registerForm.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full rounded-none h-12 text-sm uppercase tracking-widest" disabled={registerForm.formState.isSubmitting}>
                            {registerForm.formState.isSubmitting ? 'Registering...' : 'Initialize Account'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};
