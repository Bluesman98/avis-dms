/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '../../../lib/AuthContext';
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Check 2FA verification from sessionStorage
  const is2FAVerified = typeof window !== 'undefined' ? sessionStorage.getItem('is2FAVerified') === 'true' : false;

  // Track if redirect has already happened to avoid infinite loop
  const hasRedirected = useRef(false);
  useEffect(() => {
    if (authLoading) return;
    if (user && is2FAVerified && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/');
    }
  }, [user, is2FAVerified, authLoading, router]);

  const check2FAEnabled = async (uid: string) => {
    const res = await fetch('/api/2fa/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    const data = await res.json();
    return data.enabled;
  };

  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth();
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('uid', userCred.user.uid);
      localStorage.setItem('email', userCred.user.email ?? '');
      document.cookie = "token=1; path=/";
      const enabled = await check2FAEnabled(userCred.user.uid);
      if (!enabled) {
        router.push('/auth/2fa-setup');
      } else {
        router.push('/auth/2fa-verify');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetMessage(null);
    setResetError(null);
    if (!email) {
      setResetError('Please enter your email above first.');
      setTimeout(() => setResetError(null), 5000);
      return;
    }
    setResetLoading(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Password reset email sent. Check your inbox.');
      setTimeout(() => setResetMessage(null), 5000);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email.');
      setTimeout(() => setResetError(null), 5000);
    } finally {
      setResetLoading(false);
    }
  };


  // If authenticated and 2FA verified, show spinner while redirecting
  if (user && is2FAVerified) {
    return (
      <div className="flex items-center justify-center mt-8">
        <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md text-center">
          <div className="text-lg font-semibold">Redirecting...</div>
        </div>
      </div>
    );
  }

  // Otherwise, show login form
  return (
    <div className="flex items-center justify-center mt-8">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        {error && (
          <div className="mb-4 text-red-600 text-center font-semibold">
            {error}
          </div>
        )}
        {/* Sign In Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sign In</h1>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-md hover:bg-[#d4002a] transition"
              disabled={loading}
            >
              {loading ? "Checking 2FA..." : "Sign In"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-blue-600 underline text-sm"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              onClick={handlePasswordReset}
              disabled={resetLoading}
            >
              {resetLoading ? 'Sending...' : 'Forgot Password?'}
            </button>
            {resetMessage && (
              <div className="mt-2 text-green-600 text-sm font-semibold">{resetMessage}</div>
            )}
            {resetError && (
              <div className="mt-2 text-red-600 text-sm font-semibold">{resetError}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
