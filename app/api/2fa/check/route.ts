import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }
    const doc = await admin
      .firestore()
      .collection("2fa_secrets")
      .doc(uid)
      .get();
    const hasSecret = !!(doc.exists && doc.data()?.secret);
    const enabled = !!(hasSecret && doc.data()?.enabled === true);

    const response = NextResponse.json({ enabled });

    response.cookies.set("has_2fa_secret", hasSecret ? "true" : "false", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return response;
  } catch (error: unknown) {
    // Log the error for debugging (in production, use a logger or monitoring tool)
    console.error("2FA Check API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
