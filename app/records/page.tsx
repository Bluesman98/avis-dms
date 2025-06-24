/* eslint-disable @typescript-eslint/no-explicit-any */

import { neon } from '@neondatabase/serverless';
import Records from '../components/Records';
import ProtectedRoute from '../components/ProtectedRoute';

// Utility: Allow-list for fields to prevent SQL injection via field names
const ALLOWED_FIELDS = [
  // Add your allowed field names here, e.g.:
  "category_name",
  "category_id",
  "ar_kikloforias",
  "imerominia_elegxou",
  "ar_simvolaiou",
  "ar_protokollou",
  "ar_parartimatos",
  "file_path",
  "field_name",
  "display_name",
  "id",
];

// Validate that all fields are allowed
function validateFields(fields: string[]): boolean {
  return fields.every(field => ALLOWED_FIELDS.includes(field));
}

async function fetchCategories(userRole: string | null, userPermissions: Record<string, string[]> | null): Promise<{ id: any; name: any; fields: string[] }[]> {
  'use server';
  const sql = neon(`${process.env.DATABASE_URL}`);
  const response = await sql`SELECT * FROM categories`;

  const categories = response.map((row: any) => {
    const { category_name, id, ...fields } = row;
    const fieldNames = Object.keys(fields).filter(field => fields[field] === true);
    return {
      id: id,
      name: category_name,
      fields: fieldNames,
    };
  });

  if (!userRole?.includes('admin') && userPermissions) {
    return categories.filter((category: { id: number }) => {
      const categoryPermissions = userPermissions[category.id.toString()];
      return categoryPermissions && categoryPermissions.includes('read');
    });
  }

  return categories;
}

async function fetchDisplayName(field_name: string): Promise<string | null> {
  'use server';
  // Allow-list check for field_name
  if (!ALLOWED_FIELDS.includes(field_name)) {
    throw new Error("Invalid field name : " + field_name);
  }
  const sql = neon(`${process.env.DATABASE_URL}`);
  const response = await sql`SELECT * FROM display_names WHERE field_name = ${field_name}`;
  if (response.length === 0) {
    return null;
  }
  return response[0].display_name;
}

async function filterByCategory(userRole: string | null, userPermissions: Record<string, string[]> | null, category_id: number): Promise<boolean> {
  'use server';
  if (!userRole?.includes('admin') && userPermissions) {
    const categoryPermissions = userPermissions[category_id.toString()];
    if (!categoryPermissions || !categoryPermissions.includes('read')) {
      return false;
    }
  }
  return true;
}

async function simpleFilter(queryString: string, category_id: number, fields: string[]): Promise<{ [key: string]: string | number }[]> {
  'use server';
  // Validate fields to prevent SQL injection
  if (!validateFields(fields)) {
    throw new Error("Invalid field(s) in filter");
  }
  const sql = neon(`${process.env.DATABASE_URL}`);
  let query = `SELECT id, ${fields.map((field) => `"${field}"`).join(', ')} FROM records WHERE category_id = $1 AND (`;
  const params = [String(category_id)];
  fields.forEach((field, index) => {
    if (index > 0) query += ' OR ';
    query += `"${field}" LIKE $${index + 2}`;
    params.push(`%${queryString}%`);
  });
  query += ')';
  const response = await sql(query, params);
  return response;
}

async function advancedFilter(filters: { [key: string]: string }, category_id: number): Promise<{ [key: string]: string | number }[]> {
  'use server';
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

export default function RecordsPage() {
  return (
    <ProtectedRoute reqRole={["admin", "ltr", "rac"]}>
      <Records
        filterCategory={filterByCategory}
        fetchCategories={fetchCategories}
        simpleFilter={simpleFilter}
        advancedFilter={advancedFilter}
        fetchDisplayName={fetchDisplayName}
      />
    </ProtectedRoute>
  );
}


