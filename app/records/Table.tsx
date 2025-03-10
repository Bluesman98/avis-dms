/* eslint-disable @typescript-eslint/no-explicit-any */
import Record from "./Record";

function formatFieldName(fieldName: string): string {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function Table({ records, fields }: { records: any, fields: string[] }) {
  if(!fields.length) {return(<div className="text-center">Please Select Category</div>)}
  else if (!records.length && fields.length) {return(<div className="text-center">No records found</div>)}
  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          {fields.map((field, index) => (
            <th key={index} className="py-2">{formatFieldName(field)}</th>
          ))}
          <th className="py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record: any) => (
          <Record key={record.id} record={record} fields={fields} />
        ))}
      </tbody>
    </table>
  );
}

export default Table;