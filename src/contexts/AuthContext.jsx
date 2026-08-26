/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    // Session state with Session Storage for temporary persistence across refreshes
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('apfrs_token') || null);
    const [loading, setLoading] = useState(true);

    // Auto-login via URL HashCode or Session Token Validation
    useEffect(() => {
        const initAuthSession = async () => {
            // Check if URL contains direct access hashCode parameter (?hash=... or #hash=...)
            const urlParams = new URLSearchParams(window.location.search);
            let urlHash = urlParams.get('hash') || urlParams.get('hashCode');
            
            if (!urlHash && window.location.hash.includes('hash=')) {
                const match = window.location.hash.match(/hash=([^&]+)/);
                if (match) urlHash = match[1];
            }

            if (urlHash) {
                try {
                    const res = await fetch(`/api/auth/hashcode/${urlHash}`);
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user);
                        setToken(data.token);
                        localStorage.setItem('apfrs_token', data.token);
                        console.log(`🔗 [1-CLICK HASHCODE LOGIN] Successfully logged in as ${data.user.email} (${data.user.role})`);
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.warn('HashCode authentication error:', err);
                }
            }

            // Validate existing session token via backend API
            const storedToken = localStorage.getItem('apfrs_token');
            if (storedToken) {
                try {
                    const res = await fetch('/api/auth/me', {
                        headers: { 'Authorization': `Bearer ${storedToken}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user);
                        setToken(storedToken);
                    } else {
                        // Invalid or expired token
                        localStorage.removeItem('apfrs_token');
                        setToken(null);
                    }
                } catch (err) {
                    console.warn('Session verification error:', err);
                } finally {
                    setLoading(false);
                }
                return;
            }

            setLoading(false);
        };

        initAuthSession();
    }, []);

    // Username / Email & Password Login
    const login = async (username, password) => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            setUser(data.user);
            setToken(data.token);
            localStorage.setItem('apfrs_token', data.token);
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Google OAuth SSO (Domain Restricted to @jntugv.edu.in)
    const loginWithGoogle = async (email, name = '') => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Google SSO verification failed');
            }

            setUser(data.user);
            setToken(data.token);
            localStorage.setItem('apfrs_token', data.token);
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Google SSO error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Logout and clear session
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('apfrs_token');
    };

    const isPrincipal = user?.email === 'principal@jntugvcev.edu.in' || user?.isPrincipal || user?.username === 'principal' || user?.aliasUsername === 'principal';
    const isVC = user?.username === 'vc@jntugv.edu.in' || user?.aliasUsername === 'vc';
    const isRegistrar = user?.username === 'registrar@jntugv.edu.in' || user?.aliasUsername === 'registrar';
    const isHOD = user?.type === 'hod' || user?.isHOD;
    const isExecutive = user?.type === 'executive' || isVC || isRegistrar || isPrincipal;
    
    const isDMC = user?.aliasUsername === 'dmc' || user?.email === 'dmc@jntugv.edu.in';
    const isDPO = user?.aliasUsername === 'dpo' || user?.email === 'dpo@jntugv.edu.in';
    const isITProcessing = user?.type === 'it_processing' || isDMC || isDPO;
    
    const canUpload = isITProcessing || isPrincipal || user?.username === 'admin';
    // STRICT RULE: Mail sending is strictly enabled ONLY for IT Support & DMC Coordinator!
    const canSendEmail = isITProcessing;

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isFaculty: user?.role === 'faculty',
        isHOD,
        isPrincipal,
        isVC,
        isRegistrar,
        isExecutive,
        isITProcessing,
        isDMC,
        isDPO,
        canUpload,
        canSendEmail,
        login,
        loginWithGoogle,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
