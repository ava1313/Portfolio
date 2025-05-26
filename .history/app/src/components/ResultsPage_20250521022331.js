import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResultsPage() {
  const query = useQuery();
  const category = query.get("category") || "";
  const location = query.get("location") || "";
  const keyword = query.get("keyword") || "";

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all users from Firestore
    async function fetchBusinesses() {
      const userCollection = collection(db, "users");
      const snapshot = await getDocs(userCollection);

      // Filter to only "business" users and match criteria
      const results = [];
      snapshot.forEach((doc) => {
        const { role, profile } = doc.data();
        if (role !== "business" || !profile) return;

        // Category match (partial, case-insensitive)
        const catMatch = !category || 
          (profile.businessCategory && profile.businessCategory.toLowerCase().includes(category.toLowerCase()));
        // Location match (partial, case-insensitive)
        const locMatch = !location || 
          (profile.businessLocation && profile.businessLocation.toLowerCase().includes(location.toLowerCase()));
        // Keyword match (in name or keywords field)
        const kwMatch = !keyword ||
          (profile.businessName && profile.businessName.toLowerCase().includes(keyword.toLowerCase())) ||
          (profile.keywords && profile.keywords.toLowerCase().includes(keyword.toLowerCase()));

        if (catMatch && locMatch && kwMatch) {
          results.push({ id: doc.id, ...profile });
        }
      });
      setBusinesses(results);
      setLoading(false);
    }

    fetchBusinesses();
  }, [category, location, keyword]);

  return (
    <div>
      <h2>Αποτελέσματα Αναζήτησης</h2>
      {loading ? (
        <p>Loading...</p>
      ) : businesses.length === 0 ? (
        <p>Δεν βρέθηκαν αποτελέσματα.</p>
      ) : (
        <ul>
          {businesses.map((biz) => (
            <li key={biz.id}>
              <h3>{biz.businessName}</h3>
              <p>{biz.businessCategory} - {biz.businessLocation}</p>
              {biz.businessLogo && <img src={biz.businessLogo} alt={biz.businessName} style={{maxWidth: "120px"}} />}
              <p>{biz.keywords}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
