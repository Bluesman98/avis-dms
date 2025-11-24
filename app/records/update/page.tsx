import { fetchCategories } from "@/lib/categoryUtils";
import UpdateRecords from "./UpdateRecords";

export default async function UpdatePage() {
    const categories = (await fetchCategories(null, null)).map((c) => c.name);
    return <UpdateRecords categories={categories} />;
}
