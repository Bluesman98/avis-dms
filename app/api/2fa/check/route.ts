import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  const { uid } = await request.json();
  const doc = await admin.firestore().collection('2fa_secrets').doc(uid).get();
  const enabled = !!(doc.exists && doc.data()?.secret && doc.data()?.enabled === true);
  return NextResponse.json({ enabled });
}