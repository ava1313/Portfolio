import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Dashboard() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!auth.currentUser) return;
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }
    };
    fetchUser();
  }, []);

  if (!userData) return <div>Loading...</div>;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        fontFamily: "'EB Garamond', serif",
        textAlign: "center",
        padding: 20,
      }}
    >
      <img
        src="/freedome1.png"
        alt="Logo"
        style={{ width: 200, marginBottom: 20, display: "inline-block" }}
      />
      <h1>Dashboard</h1>
      <p>
        Welcome, {userData.profile?.firstName || userData.profile?.businessName || ""}
      </p>
      <p>Your role: {userData.role}</p>
      <p>
        Extra info:{" "}
        <pre style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>
          {JSON.stringify(userData.profile, null, 2)}
        </pre>
      </p>
    </div>
  );
}
