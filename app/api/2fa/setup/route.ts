import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import admin from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  const { uid, email } = await request.json();
  const doc = await admin.firestore().collection('2fa_secrets').doc(uid).get();
  let secret: string;
  if (doc.exists && doc.data()?.secret) {
    secret = doc.data()!.secret;
  } else {
    secret = authenticator.generateSecret();
    await admin.firestore().collection('2fa_secrets').doc(uid).set({ secret, enabled: false });
  }
  const otpauth = authenticator.keyuri(email, 'YourAppName', secret);
  const qr = await qrcode.toDataURL(otpauth);
  return NextResponse.json({ qr });
}