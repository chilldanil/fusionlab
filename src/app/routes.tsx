import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../features/landing/LandingPage';
import { LoginPage } from '../features/auth/LoginPage';
import { ProfilePage } from '../features/user/ProfilePage';
import { BookingPage } from '../features/booking/BookingPage';
import { useAuth } from '../shared/context/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const PublicRoute = ({ children }: { children: React.ReactElement }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (isAuthenticated) {
        return <Navigate to="/profile" replace />;
    }

    return children;
};

import { DesignSystemPage } from '../features/dev/DesignSystemPage';

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/booking"
                element={
                    <ProtectedRoute>
                        <BookingPage />
                    </ProtectedRoute>
                }
            />
            <Route path="/design" element={<DesignSystemPage />} />
        </Routes>
    );
};
