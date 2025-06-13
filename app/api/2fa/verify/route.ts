import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import admin from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  const { uid, token } = await request.json();
  const docRef = admin.firestore().collection('2fa_secrets').doc(uid);
  const doc = await docRef.get();
  const data = doc.data();
  if (!data || !data.secret) {
    return NextResponse.json({ success: false, error: 'No secret found' }, { status: 400 });
  }
  const isValid = authenticator.check(token, data.secret);
  if (isValid) {
    await docRef.update({ enabled: true });
    const response = NextResponse.json({ success: true });
    response.cookies.set('2fa_verified', 'true', { path: '/' });
    response.cookies.set('has_2fa_secret', 'true', { path: '/' });
    return response;
  }
  return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 });
}