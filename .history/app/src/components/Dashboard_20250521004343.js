// src/components/Dashboard.js
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      setLoading(false);
    }

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div style={{textAlign: "center", marginTop: "2rem"}}>
        Loading dashboard...
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{textAlign: "center", marginTop: "2rem"}}>
        No user data found. Please complete your profile.
      </div>
    );
  }

  const { role, profile } = userData;

  return (
    <div style={{
      maxWidth: 700,
      margin: "40px auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: 20,
      backgroundColor: "#fff",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      borderRadius: 12
    }}>
      <img
        src="/logo.png"
        alt="Freedome Logo"
        style={{ display: "block", margin: "0 auto 20px", width: 180 }}
      />

      <h1 style={{ textAlign: "center", marginBottom: 24 }}>
        Welcome {profile?.firstName || profile?.businessName || "User"}!
      </h1>

      <p><strong>Role:</strong> {role}</p>

      <section style={{ marginTop: 20 }}>
        <h2>Your Profile Details</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {profile && Object.entries(profile).map(([key, value]) => (
              <tr key={key} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "8px 12px", fontWeight: "600", textTransform: "capitalize" }}>
                  {key.replace(/([A-Z])/g, ' $1')}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  {typeof value === "string" ? value : JSON.stringify(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
