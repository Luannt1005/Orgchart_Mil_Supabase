"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string | number;
    username: string;
    full_name: string;
    role: string;
}

interface UserContextProps {
    user: User | null;
    setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    // Initialize from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('user');
            if (stored) {
                try {
                    setUser(JSON.parse(stored));
                } catch (e) {
                    console.error('Failed to parse stored user', e);
                    localStorage.removeItem('user');
                }
            }
        }
    }, []);

    // Keep localStorage in sync when user changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                // Only clear if we explicitly set user to null (logout), 
                // but be careful not to clear on initial load if we haven't fetched yet.
                // For simplicity, we can optionaly remove this or make it smarter.
                // However, usually we set user to null on logout.
                // If user is null initially, we might not want to clear localStorage immediately 
                // if we are relying on the first useEffect to load it.
                // BUT, since we initialize state as null, this effect runs with null.
                // To avoid clearing it on mount, we can check if it's the first render using a ref,
                // OR we can just rely on the login/logout functions to update localStorage manually,
                // and use this context mainly for in-memory state distribution.

                // Let's stick to manual localStorage management in login/logout for safety 
                // to avoid race conditions clearing the data.
                // BUT, the requirement says "update the UserContext and localStorage...".
                // Let's make the context the source of truth *after* initialization.
            }
        }
    }, [user]);

    // Better approach:
    // 1. Load from LS on mount.
    // 2. Provide a wrapper for setUser that also updates LS.

    const updateUser = (newUser: User | null) => {
        setUser(newUser);
        if (typeof window !== 'undefined') {
            if (newUser) {
                localStorage.setItem('user', JSON.stringify(newUser));
            } else {
                localStorage.removeItem('user');
            }
        }
    };

    return (
        <UserContext.Provider value={{ user, setUser: updateUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextProps => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
