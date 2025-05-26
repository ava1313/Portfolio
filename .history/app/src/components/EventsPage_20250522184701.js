// src/components/CreateEventPage.js
import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import Navbar from "./Navbar";

export default function CreateEventPage() {
  const [userRole, setUserRole] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loadingRole, setLoadingRole] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUserRole() {
      const user = auth.currentUser;
      if (!user) {
        setUserRole(null);
        setLoadingRole(false);
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      setUserRole(userDoc.exists() ? userDoc.data().role : null);
      setLoadingRole(false);
    }
    fetchUserRole();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Συμπληρώστε τίτλο και περιγραφή.");
      return;
    }
    if (userRole !== "business") {
      alert("Μόνο επιχειρήσεις μπορούν να δημιουργήσουν εκδηλώσεις.");
      return;
    }
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      const eventsRef = collection(db, "users", user.uid, "events");
      await addDoc(eventsRef, {
        title: title.trim(),
        description: description.trim(),
        timestamp: serverTimestamp(),
        attendees: [],
      });
      alert("Η εκδήλωση δημιουργήθηκε με επιτυχία!");
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Σφάλμα δημιουργίας εκδήλωσης:", error);
      alert("Παρουσιάστηκε σφάλμα κατά τη δημιουργία.");
    }
    setSubmitting(false);
  };

  if (loadingRole) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: 80 }}>Φόρτωση...</div>
      </>
    );
  }

  if (!auth.currentUser) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: 80 }}>
          Πρέπει να είστε συνδεδεμένος για να δημιουργήσετε εκδήλωση.
        </div>
      </>
    );
  }

  if (userRole !== "business") {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: 80 }}>
          Μόνο επιχειρήσεις μπορούν να δημιουργήσουν εκδηλώσεις.
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
        <h1>Δημιουργία Νέας Εκδήλωσης</h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text"
            placeholder="Τίτλος εκδήλωσης"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={submitting}
            style={{ padding: 8, fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
          />
          <textarea
            placeholder="Περιγραφή εκδήλωσης"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
            disabled={submitting}
            style={{ padding: 8, fontSize: 16, borderRadius: 6, border: "1px solid #ccc", resize: "vertical" }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "12px 0",
              fontSize: 18,
              backgroundColor: "#191919",
              color: "#fff",
              border: "none",
              borderRadius: 24,
              cursor: submitting ? "wait" : "pointer",
              fontWeight: 600,
            }}
          >
            {submitting ? "Αποστολή..." : "Δημιουργία Εκδήλωσης"}
          </button>
        </form>
      </div>
    </>
  );
}
