'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function TwoFASetup() {
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [uid, setUid] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUid = localStorage.getItem('uid');
    const storedEmail = localStorage.getItem('email');
    if (storedUid) 
    if (storedUid && storedEmail) {
      setUid(storedUid);

      fetch('/api/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: storedUid, email: storedEmail }),
      })
        .then(res => res.json())
        .then(data => setQr(data.qr))
        .catch(() => setError('Failed to generate QR code'));
    }
  }, []);

  const handleVerify = async () => {
    setError(null);
    const res = await fetch('/api/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token: code }),
    });
    const data = await res.json();
    if (data.success) {
      // Optionally set a cookie to indicate 2FA secret is set up
      document.cookie = "has_2fa_secret=true; path=/";
      window.location.href = '/';
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
            <Image src={qr} alt="Scan with Google Authenticator" className="mx-auto mb-4" />
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Enter 2FA code"
              className="w-full px-4 py-2 mb-4 border rounded-md"
            />
            <button
              onClick={handleVerify}
              className="w-full bg-black text-white py-2 rounded-md hover:bg-[#d4002a] transition"
              disabled={!code}
            >
              Verify
            </button>
          </>
        ) : (
          <div>Loading QR code...</div>
        )}
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
}