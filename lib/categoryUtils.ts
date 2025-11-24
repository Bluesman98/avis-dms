import { neon } from "@neondatabase/serverless";
import { ALLOWED_FIELDS } from "@/app/utils/allowedFields";

// Validate that all fields are allowed
export function validateFields(fields: string[]): boolean {
  return fields.every((field) => ALLOWED_FIELDS.includes(field));
}

// Fetch all categories with their allowed fields
export async function fetchCategories(
  userRole: string | null,
  userPermissions: Record<string, string[]> | null
): Promise<{ id: number; name: string; fields: string[] }[]> {
  "use server";
  const sql = neon(`${process.env.DATABASE_URL}`);
  const response = await sql`SELECT * FROM categories`;

  const categories = response.map((row: Record<string, unknown>) => {
    const { category_name, id, ...fields } = row;
    const fieldNames = Object.keys(fields).filter(
      (field) => fields[field] === true
    );
    return {
      id: id as number,
      name: category_name as string,
      fields: fieldNames,
    };
  });

  if (!userRole?.includes("admin") && userPermissions) {
    return categories.filter((category: { id: number }) => {
      const categoryPermissions = userPermissions[category.id.toString()];
      return categoryPermissions && categoryPermissions.includes("read");
    });
  }

  return categories;
}

export async function fetchDisplayName(
  field_name: string
): Promise<string | null> {
  "use server";
  // Allow-list check for field_name
  if (!ALLOWED_FIELDS.includes(field_name)) {
    throw new Error("Invalid field name : " + field_name);
  }
  const sql = neon(`${process.env.DATABASE_URL}`);
  const response =
    await sql`SELECT * FROM display_names WHERE field_name = ${field_name}`;
  if (response.length === 0) {
    return null;
  }
  return response[0].display_name;
}

export async function filterByCategory(
  userRole: string | null,
  userPermissions: Record<string, string[]> | null,
  category_id: number
): Promise<boolean> {
  "use server";
  if (!userRole?.includes("admin") && userPermissions) {
    const categoryPermissions = userPermissions[category_id.toString()];
    if (!categoryPermissions || !categoryPermissions.includes("read")) {
      return false;
    }
  }
  return true;
}

export async function simpleFilter(
  queryString: string,
  category_id: number,
  fields: string[]
): Promise<{ [key: string]: string | number }[]> {
  "use server";
  // Validate fields to prevent SQL injection
  if (!validateFields(fields)) {
    throw new Error("Invalid field(s) in filter");
  }
  const sql = neon(`${process.env.DATABASE_URL}`);
  let query = `SELECT id, ${fields
    .map((field) => `"${field}"`)
    .join(", ")} FROM records WHERE category_id = $1 AND (`;
  const params = [String(category_id)];
  fields.forEach((field, index) => {
    if (index > 0) query += " OR ";
    query += `"${field}" LIKE $${index + 2}`;
    params.push(`%${queryString}%`);
  });
  query += ")";
  const response = await sql(query, params);
  return response;
}

export async function advancedFilter(
  filters: { [key: string]: string },
  category_id: number
): Promise<{ [key: string]: string | number }[]> {
  "use server";
  // Validate fields to prevent SQL injection
  if (!validateFields(Object.keys(filters))) {
    throw new Error("Invalid field(s) in advanced filter");
  }
  const sql = neon(`${process.env.DATABASE_URL}`);
  let query = `SELECT id, * FROM records WHERE category_id = $1`;
  const params = [String(category_id)];
  let paramIndex = 2;
  for (const field in filters) {
    if (filters[field]) {
      query += ` AND "${field}" LIKE $${paramIndex}`;
      params.push(`%${filters[field]}%`);
      paramIndex++;
    }
  }
  const response = await sql(query, params);
  return response;
}
