import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // List all your httpOnly cookies here
  const cookiesToClear = [
    "token",
    "2fa_verified",
    "has_2fa_secret",
    "firebase_id_token"
  ];

  cookiesToClear.forEach(name => {
    response.cookies.set(name, '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });
  });

  return response;
}