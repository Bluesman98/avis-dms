import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { ALLOWED_FIELDS } from "@/app/utils/allowedFields";

export async function GET(
  req: NextRequest,
  context: { params: { field: string } }
) {
  const { field } = await context.params;
  if (!ALLOWED_FIELDS.includes(field)) {
    return NextResponse.json({ error: "Invalid field name" }, { status: 400 });
  }
  const sql = neon(`${process.env.DATABASE_URL}`);
  const response =
    await sql`SELECT * FROM display_names WHERE field_name = ${field}`;
  if (!response || response.length === 0) {
    return NextResponse.json({ displayName: null });
  }
  return NextResponse.json({ displayName: response[0].display_name });
}
