'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTwoFA } from '../../../lib/TwoFAContext';
import { useAuth } from '@/lib/AuthContext';
import { isPasswordExpired } from '../auth';

export default function TwoFAVerify() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setIsVerified, isVerified } = useTwoFA();
  const { user } = useAuth();

  // Redirect if user is logged in and already verified
  useEffect(() => {
    if (user && isVerified) {
      router.replace('/');
    }
  }, [user, isVerified, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const uid = localStorage.getItem('uid');
    let data;
    const errorMsg = 'Invalid code';
    try {
      const res = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, token: code }),
      });

      // Try to parse JSON, even on error
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      setLoading(false);

      if (res.ok && data.success) {
        setIsVerified(true);
        try {
          if (!uid) {
            throw new Error("User ID not found in localStorage");
          }
          const expired = await isPasswordExpired(uid);

          const response = await fetch('/api/set-password-expired', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expired, uid }),
          });

          if (!response.ok) {
            throw new Error('Failed to set password expired status');
          }

          if (expired) {
            router.push("/auth/force-password-reset");
          } else {
            window.location.href = "/";
          }
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Login failed");
          }
        }
      } else {
        setError(data.error || errorMsg);
      }
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  };

  // Optionally, show nothing while redirecting
  if (user && isVerified) {
    return null;
  }

  return (
    <div className="flex items-center justify-center mt-8">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">2FA Verification</h1>
        <form onSubmit={handleVerify}>
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter 2FA code"
            className="w-full px-4 py-2 mb-4 border rounded-md"
          />
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:bg-[#d4002a] transition"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
}