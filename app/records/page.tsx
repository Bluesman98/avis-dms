/* eslint-disable @typescript-eslint/no-explicit-any */

import { neon } from '@neondatabase/serverless';
import Records from './Records';
import ProtectedRoute from '@/components/ProtectedRoute';


export async function fetchCategories(userRole: string | null, userPermissions: string[] | null) {
  'use server';
  // Connect to the Neon database
  const sql = neon(`${process.env.DATABASE_URL}`);
  // Fetch categories from the database
  const response = await sql`SELECT * FROM categories`;
  console.log(response);

  // Transform the data to the desired format
  const categories = response.map((row: any) => {
    const { category_name, id, ...fields } = row;
    const fieldNames = Object.keys(fields).filter(field => fields[field] === true);
    return {
      id: id,
      name: category_name,
      fields: fieldNames,
    };
  });

  // Filter categories based on user role and permissions
  if (!userRole?.includes('admin') && userPermissions) {
    return categories.filter((category: { id: number }) => userPermissions.includes(category.id.toString()));
  }

  return categories;
}

async function filterByCategory(category_id: number): Promise<{ [key: string]: string | number }[]> {
  'use server';
  // Connect to the Neon database
  const sql = neon(`${process.env.DATABASE_URL}`);
  // Fetch records by category
  const response = await sql`SELECT * FROM kilkis WHERE category_id = ${category_id}`;
  console.log(response);
  return response;
}

async function simpleFilter(queryString: string, category_id: number, fields: string[]): Promise<{ [key: string]: string | number }[]> {
  'use server';
  // Connect to the Neon database
  const sql = neon(`${process.env.DATABASE_URL}`);
  // Build the SQL query dynamically based on the provided fields
  let query = `SELECT * FROM kilkis WHERE category_id = $1 AND (`;
  const params = [String(category_id)];
  fields.forEach((field, index) => {
    if (index > 0) query += ' OR ';
    query += `"${field}" LIKE $${index + 2}`;
    params.push(`%${queryString}%`);
  });
  query += ')';
  console.log('Query: ', query);
  const response = await sql(query, params);
  console.log(response);
  return response;
}

async function advancedFilter(filters: { [key: string]: string }, category_id: number): Promise<{ [key: string]: string | number }[]> {
  'use server';
  // Connect to the Neon database
  const sql = neon(`${process.env.DATABASE_URL}`);
  // Build the SQL query dynamically based on the provided filters
  let query = `SELECT * FROM kilkis WHERE category_id = $1`;
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
  console.log(response);
  return response;
}

export default function RecordsPage() {
 

  return (
    <ProtectedRoute reqRole={["admin", "user"]}>
      <div>
        <h1>Records Page</h1>
        <p>This is the records page.</p>
        <Records filterCategory={filterByCategory} fetchCategories={fetchCategories} simpleFilter={simpleFilter} advancedFilter={advancedFilter} />
      </div>
    </ProtectedRoute>
  );
}


