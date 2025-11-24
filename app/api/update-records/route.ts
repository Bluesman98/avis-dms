import { NextResponse } from "next/server";
import { ALLOWED_FIELDS } from "@/app/utils/allowedFields";
import { neon } from "@neondatabase/serverless";
// import { Readable } from 'stream';

export async function POST(req: Request) {
  try {
    // Expect JSON body: { rows: Array<Record<string, string|number|null>>, category: string, keyField: string }
    const body = await req.json();
    const { rows, category, keyField } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid rows (must be non-empty array)" },
        { status: 400 }
      );
    }
    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid category" },
        { status: 400 }
      );
    }
    if (!keyField || typeof keyField !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid key field" },
        { status: 400 }
      );
    }

    // Validate headers
    const headers = Object.keys(rows[0]);
    if (!headers.includes(keyField)) {
      return NextResponse.json(
        { error: `Key field '${keyField}' not found in data headers` },
        { status: 400 }
      );
    }
    // Validate allowed fields (universal, not per-category for now)
    const invalidFields = headers.filter(
      (h) => h !== keyField && !ALLOWED_FIELDS.includes(h)
    );
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: `Invalid fields in data: ${invalidFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Step 3-5: Record matching and update logic
    const sql = neon(`${process.env.DATABASE_URL}`);
    const updated: string[] = [];
    const missing: string[] = [];
    const errors: { key: string; error: string }[] = [];

    for (const row of rows) {
      const keyValue = row[keyField];
      if (keyValue === undefined || keyValue === null) {
        errors.push({
          key: String(keyValue),
          error: "Missing key field value",
        });
        continue;
      }
      // Check if record exists
      let existing;
      try {
        const res = await sql(`SELECT id FROM records WHERE ${keyField} = $1`, [
          keyValue,
        ]);
        existing = res && res[0];
      } catch {
        errors.push({ key: String(keyValue), error: "DB lookup error" });
        continue;
      }
      if (!existing) {
        missing.push(String(keyValue));
        continue;
      }
      // Prepare update fields (allowed only)
      const filteredEntries = Object.entries(row).filter(
        ([key]) => ALLOWED_FIELDS.includes(key) && key !== keyField
      );
      if (filteredEntries.length === 0) {
        errors.push({
          key: String(keyValue),
          error: "No valid fields to update",
        });
        continue;
      }
      const setClause = filteredEntries
        .map(([key], i) => `"${key}" = $${i + 1}`)
        .join(", ");
      const values = filteredEntries.map(([, value]) => value);
      try {
        await sql(
          `UPDATE records SET ${setClause} WHERE ${keyField} = $${
            values.length + 1
          }`,
          [...values, keyValue]
        );
        updated.push(String(keyValue));
      } catch {
        errors.push({ key: String(keyValue), error: "Update failed" });
      }
    }

    // Return summary report
    return NextResponse.json({
      message: "Update complete",
      updatedCount: updated.length,
      missingCount: missing.length,
      errorCount: errors.length,
      updated,
      missing,
      errors,
    });
  } catch (error) {
    const errMsg =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
// End of file
