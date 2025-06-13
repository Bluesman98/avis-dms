'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTwoFA } from '../../../lib/TwoFAContext';

export default function TwoFAVerify() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setIsVerified } = useTwoFA();

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    const uid = localStorage.getItem('uid');
    const res = await fetch('/api/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token: code }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setIsVerified(true);
      router.push('/');
    } else {
      setError(data.error || 'Invalid code');
    }
  };

  return (
    <div className="flex items-center justify-center mt-8">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">2FA Verification</h1>
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Enter 2FA code"
          className="w-full px-4 py-2 mb-4 border rounded-md"
        />
        <button
          onClick={handleVerify}
          className="w-full bg-black text-white py-2 rounded-md hover:bg-[#d4002a] transition"
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
}