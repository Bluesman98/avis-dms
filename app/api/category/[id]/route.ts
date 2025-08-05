import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { ALLOWED_FIELDS } from "@/app/utils/allowedFields";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  const sql = neon(`${process.env.DATABASE_URL}`);
  const categoryRes = await sql(`SELECT * FROM categories WHERE id = $1`, [id]);
  if (!categoryRes || categoryRes.length === 0) {
    return NextResponse.json({ fields: [] });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { category_name, ...fields } = categoryRes[0];
  const fieldNames = Object.keys(fields).filter(
    (field) => fields[field] === true && ALLOWED_FIELDS.includes(field)
  );

  // Get display names for all fields in one query
  const displayRes = await sql(
    `SELECT field_name, display_name FROM display_names WHERE field_name = ANY($1::text[])`,
    [fieldNames]
  );
  const displayMap: Record<string, string> = {};
  displayRes.forEach((row: unknown) => {
    const { field_name, display_name } = row as {
      field_name: string;
      display_name: string;
    };
    displayMap[field_name] = display_name;
  });

  const resultFields = fieldNames.map((field) => ({
    field,
    displayName: displayMap[field] || field,
  }));

  return NextResponse.json({ fields: resultFields });
}
