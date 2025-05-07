import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="container mx-auto p-4 text-white flex-col items-center justify-center">
      <h1  className="text-2xl font-bold ">404 - Not Found</h1>
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  )
}