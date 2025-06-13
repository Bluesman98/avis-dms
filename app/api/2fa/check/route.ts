import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  const { uid } = await request.json();
  const doc = await admin.firestore().collection('2fa_secrets').doc(uid).get();
  const hasSecret = !!(doc.exists && doc.data()?.secret);
  const enabled = !!(hasSecret && doc.data()?.enabled === true);

  const response = NextResponse.json({ enabled });

  // Set or clear has_2fa_secret cookie
  response.cookies.set('has_2fa_secret', hasSecret ? 'true' : 'false', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });


  return response;
}