'use clie';
import { neon } from '@neondatabase/serverless';
import Records from './Records';


const categories = [
    {name :'Ν.3843-2010', fields: ['folderName', 'range', 'category', 'filePath', 'subCategory']}, 
    {name :'N.1337', fields: ['folderName', 'category', 'filePath']}, 
    {name :'ΔΙΟΡΘΩΤΙΚΕΣ ΠΡΑΞΕΙΣ ΕΦΑΡΜΟΓΗΣ', fields: [ 'category', 'filePath', 'area', 'year', 'protocolNo']}, 
    {name :'ΕΓΚΡΙΣΗ ΚΕΡΑΙΩΝ', fields: ['category', 'filePath', 'area', 'year', 'aproovalNo']}, 
    {name :'ΕΓΚΡΙΣΗ ΕΡΓΑΣΙΩΝ ΜΙΚΡΗΣ ΚΛΙΜΑΚΑΣ', fields: ['folderName', 'category', 'filePath', 'year', 'aproovalNo']}, 
    {name :'Ν.3775-2009', fields: ['folderName', 'subCategory', 'category', 'filePath']}, 
    {name :'ΣΧΕΔΙΑ ΧΑΡΤΩΝ ΟΙΚΟΔΟΜΙΚΩΝ ΓΡΑΜΜΩΝ', fields: ['folderName', 'category', 'filePath', 'buildingBlock']}, 
    {name :'ΠΡΑΞΕΙΣ ΕΦΑΡΜΟΓΗΣ', fields: ['category', 'filePath', 'area', 'buildingBlock']}
]

/*async function getRecords(): Promise<any> {
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
  const response = await sql`SELECT * FROM kilkis`;
  console.log(response)
  return response
  }*/

  async function filterByCategory(category :string): Promise<{ [key: string]: string | number }[]> {
    'use server'
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Insert the comment from the form into the Postgres database
  const response = await sql`SELECT * FROM kilkis WHERE category = ${category}`;
  console.log(response)
  return response
  }

  async function simpleFilter(queryString: string, category: string, fields: string[]): Promise<{ [key: string]: string | number }[]> {
    'use server';
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Build the SQL query dynamically based on the provided fields
    let query = `SELECT * FROM kilkis WHERE category = $1 AND (`;
    const params = [category];
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
  async function advancedFilter(filters: { [key: string]: string }, category: string): Promise<{ [key: string]: string | number }[]> {
    'use server';
    // Connect to the Neon database
    const sql = neon(`${process.env.DATABASE_URL}`);
    // Build the SQL query dynamically based on the provided filters
    let query = `SELECT * FROM kilkis WHERE category = $1`;
    const params = [category];
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
export default async function RecordsPage() {
    return (
        <div>
            <h1>Records Page</h1>
            <p>This is the records page.</p>
          
            <Records filterCategory={filterByCategory} categories={categories} simpleFilter={simpleFilter} advancedFilter={advancedFilter}/>
        </div>
    );
};


