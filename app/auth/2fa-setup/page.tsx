'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { isPasswordExpired } from '../auth';
import { useTwoFA } from '@/lib/TwoFAContext';
import { useRouter } from 'next/navigation';

export default function TwoFASetup() {
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null); // <-- Add this line
  const [code, setCode] = useState('');
  const [uid, setUid] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { setIsVerified } = useTwoFA();
  const router = useRouter();

  useEffect(() => {
    const storedUid = localStorage.getItem('uid');
    const storedEmail = localStorage.getItem('email');
    if (storedUid && storedEmail) {
      setUid(storedUid);

      fetch('/api/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: storedUid, email: storedEmail }),
      })
        .then(res => res.json())
        .then(data => {
          setQr(data.qr);
          setSecret(data.secret); // <-- Set the secret
        })
        .catch(() => setError('Failed to generate QR code'));
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token: code }),
      credentials: 'include',
    });
    const data = await res.json();
    if (data.success) {
      setIsVerified(true);
      try {
        const expired = await isPasswordExpired(uid);
        const response = await fetch('/api/set-password-expired', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expired, uid }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to set password expired status');
        }

        if (expired) {
          router.push("/auth/force-password-reset");
        } else {
          router.push("/");
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Login failed");
        }
      }
    } else {
      setError(data.error || 'Invalid code');
    }
  };

  return (
    <div className="flex items-center justify-center mt-8">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Set Up 2FA</h1>
        {qr ? (
          <>
            <p className="mb-4">Scan this QR code with Google Authenticator, then enter the code below to complete setup.</p>
            <div className="w-full flex justify-center mb-4">
              <div className="relative" style={{ width: '100%', maxWidth: 200, aspectRatio: '1 / 1' }}>
                <Image
                  src={qr}
                  fill
                  alt="Scan with Google Authenticator"
                  className="object-contain rounded"
                  sizes="(max-width: 400px) 100vw, 200px"
                  priority
                />
              </div>
            </div>
            {/* Display the secret as a failsafe */}
            {secret && (
              <div className="mb-4 text-center">
                <span className="block text-gray-700 text-sm mb-1">Or enter this code manually:</span>
                <span className="font-mono text-lg bg-gray-100 px-2 py-1 rounded">{secret}</span>
              </div>
            )}
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
                disabled={!code}
              >
                Verify
              </button>
            </form>
          </>
        ) : (
          <div>Loading QR code...</div>
        )}
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
}