import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { ALLOWED_FIELDS } from "@/app/utils/allowedFields";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const updates = await req.json();

  const filteredEntries = Object.entries(updates).filter(
    ([key]) => ALLOWED_FIELDS.includes(key) && key !== "id"
  );
  if (filteredEntries.length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const setClause = filteredEntries
    .map(([key], i) => `"${key}" = $${i + 1}`)
    .join(", ");
  const values = filteredEntries.map(([, value]) => value);

  const sql = neon(`${process.env.DATABASE_URL}`);
  try {
    await sql(
      `UPDATE records SET ${setClause} WHERE id = $${values.length + 1}`,
      [...values, id]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // Await params as a promise
  const sql = neon(`${process.env.DATABASE_URL}`);
  const result = await sql(`SELECT * FROM records WHERE id = $1`, [id]);
  if (!result || result.length === 0) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }
  return NextResponse.json(result[0]);
}
