// src/components/ResultsPage.js
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResultsPage() {
  const queryParams = useQuery();
  const category = queryParams.get("category") || "";
  const location = queryParams.get("location") || "";
  const keyword = queryParams.get("keyword") || "";

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  // NOTE: Location radius filtering requires geoquery (geohashes etc),
  // this is a simple demo filtering just by category and keywords.

  useEffect(() => {
    const fetchBusinesses = async () => {
      setLoading(true);
      try {
        const colRef = collection(db, "businesses");

        // Build query conditions dynamically
        let constraints = [];
        if (category) {
          constraints.push(where("businessCategory", "==", category));
        }
        if (keyword) {
          constraints.push(where("keywords", "array-contains", keyword.toLowerCase()));
        }

        // Firestore does not support 'OR' queries easily; for simplicity, we combine with AND.
        // Location radius filtering is advanced and requires geospatial queries or third-party libs.

        let q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
        const snapshot = await getDocs(q);

        // Simple filter on location substring match
        let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (location) {
          results = results.filter(b =>
            b.businessLocation?.toLowerCase().includes(location.toLowerCase())
          );
        }

        setBusinesses(results);
      } catch (err) {
        console.error("Error fetching businesses", err);
      }
      setLoading(false);
    };

    fetchBusinesses();
  }, [category, location, keyword]);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h2>Αποτελέσματα Αναζήτησης</h2>
      <p>
        Αναζήτηση για: <b>Κατηγορία</b>: {category || "Όλες"}, <b>Τοποθεσία</b>: {location || "Οπουδήποτε"}, <b>Λέξεις κλειδιά</b>: {keyword || "Όλα"}
      </p>

      {loading && <p>Φόρτωση αποτελεσμάτων...</p>}

      {!loading && businesses.length === 0 && (
        <p>Δεν βρέθηκαν επιχειρήσεις με αυτά τα κριτήρια.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {businesses.map((b) => (
          <li
            key={b.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
            }}
          >
            <h3>{b.businessName}</h3>
            <p><b>Κατηγορία:</b> {b.businessCategory}</p>
            <p><b>Τοποθεσία:</b> {b.businessLocation}</p>
            <p><b>Τύπος:</b> {b.businessType}</p>
            <p><b>Λέξεις κλειδιά:</b> {(b.keywords || []).join(", ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
