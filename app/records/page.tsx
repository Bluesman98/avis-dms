

import {
  fetchCategories,
  fetchDisplayName,
  filterByCategory,
  simpleFilter,
  advancedFilter,
} from "@/lib/categoryUtils";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import Records from "../components/Records";

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


