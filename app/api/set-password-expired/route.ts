import admin from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { expired } = await request.json();
    console.log(`Setting passwordExpired cookie to: ${expired}`);
    
    // Create the response object with proper JSON content
    const response = NextResponse.json({ 
      success: true,
      message: `Password expired status set to: ${expired}`,
      timestamp: new Date().toISOString()
    });
    
    // Set the cookie with proper options
    response.cookies.set('passwordExpired', expired ? 'true' : 'false', {
      path: '/',           // Available on all paths
      httpOnly: false,     // Make it readable by client JS
      sameSite: 'lax',     // Standard security setting
      maxAge: 60 * 60 * 24 // 24 hours
    });
    
    console.log("Cookie set in response");

    const { uid } = await request.json();
    console.log(`Revoking refresh tokens for user: ${uid}`);
    await admin.auth().revokeRefreshTokens(uid);

    return response;
  } catch (error) {
    console.error('Error setting password expired cookie:', error);
    return NextResponse.json({ success: false, error: 'Failed to set cookie' }, { status: 500 });
  }
}