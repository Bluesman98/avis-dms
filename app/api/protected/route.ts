import admin from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Get user ID from session or verified ID token
  const idToken = request.cookies.get('firebase_id_token')?.value;
  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const decoded = await admin.auth().verifyIdToken(idToken);
  const doc = await admin.firestore().collection('2fa_secrets').doc(decoded.uid).get();
  if (!doc.exists || doc.data()?.enabled !== true) {
    return NextResponse.json({ error: '2FA not verified' }, { status: 403 });
  }
  // Proceed with protected logic
  return NextResponse.json({ success: true });
}