import { NextResponse } from "next/server";
import { ALLOWED_FIELDS } from "@/app/utils/allowedFields";

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

    // Optionally: check for duplicate keyField values in rows
    const keyValues = new Set();
    for (const row of rows) {
      if (row[keyField] == null) {
        return NextResponse.json(
          { error: `Row missing key field value` },
          { status: 400 }
        );
      }
      if (keyValues.has(row[keyField])) {
        return NextResponse.json(
          { error: `Duplicate key field value: ${row[keyField]}` },
          { status: 400 }
        );
      }
      keyValues.add(row[keyField]);
    }

    // Validation passed
    return NextResponse.json({
      message: "Validation successful",
      category,
      keyField,
      headers,
      rowCount: rows.length,
      preview: rows.slice(0, 5),
    });
  } catch (error) {
    const errMsg =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
