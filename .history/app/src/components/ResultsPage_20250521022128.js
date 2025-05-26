import React from "react";
import { useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResultsPage() {
  const query = useQuery();
  const category = query.get("category") || "";
  const location = query.get("location") || "";
  const keyword = query.get("keyword") || "";

  // Here, fetch or filter results based on the query params.
  // For example, fetch from Firebase or a mock data array.

  return (
    <div>
      <h2>Αποτελέσματα Αναζήτησης</h2>
      <p>
        <b>Κατηγορία:</b> {category || <i>καμία</i>}<br />
        <b>Τοποθεσία:</b> {location || <i>καμία</i>}<br />
        <b>Λέξεις-κλειδιά:</b> {keyword || <i>καμία</i>}
      </p>
      {/* Render your results here */}
    </div>
  );
}
