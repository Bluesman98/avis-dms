import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { authenticator } from 'otplib';

export async function POST(request: NextRequest) {
  const { uid, token } = await request.json();
  const docRef = admin.firestore().collection('2fa_secrets').doc(uid);
  const doc = await docRef.get();
  if (!doc.exists || !doc.data()?.secret) {
    return NextResponse.json({ success: false, error: 'No secret found' }, { status: 400 });
  }
  const secret = doc.data()!.secret as string;
  const isValid = authenticator.check(token, secret);
  if (isValid) {
    // Mark 2FA as enabled in Firestore
    await docRef.update({ enabled: true, verifiedAt: new Date() });
    // Optionally set a cookie for UX/middleware
    const response = NextResponse.json({ success: true });
    response.cookies.set('2fa_verified', 'true', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return response;
  }
  return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 });
}