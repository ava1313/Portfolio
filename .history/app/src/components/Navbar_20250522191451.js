import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

export default function Navbar() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // "offer" ή "event"
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchUserRole() {
      const user = auth.currentUser;
      if (!user) {
        setUserRole(null);
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role);
      }
    }
    fetchUserRole();
  }, []);

  const buttonStyle = {
    background: "#fff",
    borderRadius: "50%",
    border: "3px solid #000",
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  };

  const openCreateModal = () => {
    const choice = window.prompt("Πάτησε 1 για Προσφορά\nΠάτησε 2 για Εκδήλωση");
    if (choice === "1") setModalType("offer");
    else if (choice === "2") setModalType("event");
    else return;
    setFormData({ title: "", description: "" });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData((fd) => ({ ...fd, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("Παρακαλώ συμπληρώστε τον τίτλο.");
    if (!formData.description.trim()) return alert("Παρακαλώ συμπληρώστε την περιγραφή.");
    if (!auth.currentUser) return alert("Πρέπει να είστε συνδεδεμένος.");

    setSubmitting(true);
    try {
      const userId = auth.currentUser.uid;
      const colName = modalType === "offer" ? "offers" : "events";
      const colRef = collection(db, "users", userId, colName);

      await addDoc(colRef, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        timestamp: serverTimestamp(),
        businessId: userId,
        attendees: modalType === "event" ? [] : undefined,
      });

      alert(`${modalType === "offer" ? "Προσφορά" : "Εκδήλωση"} δημιουργήθηκε!`);
      setModalOpen(false);

      if (modalType === "offer") navigate("/prospores");
      else if (modalType === "event") navigate("/ekdiloseis");
    } catch (err) {
      console.error("Error creating document:", err);
      alert("Σφάλμα κατά τη δημιουργία.");
    }
    setSubmitting(false);
  };

  return (
    <>
      <header
        style={{
          width: "100vw",
          backgroundColor: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          borderBottom: "1px solid #eee",
          padding: "10px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          boxSizing: "border-box",
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        {/* Αριστερά: Χάρτης, Προσφορές, Εκδηλώσεις */}
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/businessesmap")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/businessesmap");
            }}
            aria-label="Χάρτης Επιχειρήσεων"
            style={buttonStyle}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="black"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 21c-4.97-5.38-8-8.65-8-11a8 8 0 1116 0c0 2.35-3.03 5.62-8 11z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/prospores")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/prospores");
            }}
            aria-label="Προσφορές"
            style={buttonStyle}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="black"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20 12.5V7a2 2 0 0 0-2-2h-5.5a2 2 0 0 0-1.41.59l-7.09 7.09a2 2 0 0 0 0 2.82l5.5 5.5a2 2 0 0 0 2.82 0l7.09-7.09A2 2 0 0 0 20 12.5z" />
              <circle cx="7.5" cy="7.5" r="1.5" />
            </svg>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/ekdiloseis")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/ekdiloseis");
            }}
            aria-label="Εκδηλώσεις"
            style={buttonStyle}
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="black"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
        </div>

        {/* Κεντρικό λογότυπο */}
        <img
          src="/logo.png"
          alt="freedome logo"
          style={{
            height: 50,
            cursor: "pointer",
            objectFit: "contain",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            userSelect: "none",
          }}
          onClick={() => navigate("/mainpage")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/mainpage");
          }}
          aria-label="Go to homepage"
        />

        {/* Δεξιά: Προφίλ + Αγαπημένα */}
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            height: "100%",
            flexShrink: 0,
            marginRight: 10,
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/dashboard")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/dashboard");
            }}
            aria-label="User profile icon"
            style={buttonStyle}
          >
            <svg
              viewBox="0 0 40 40"
              width="24"
              height="24"
              fill="none"
              stroke="black"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="20" cy="15" r="8" />
              <path d="M4 38c0-7 14-11 16-11s16 4 16 11" />
            </svg>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/favorites")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/favorites");
            }}
            aria-label="Favorites"
            style={buttonStyle}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="black"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h1.87C14.46 4.99 15.96 4 17.5 4 20 4 22 6 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z" />
            </svg>
          </div>
        </div>
      </header>

      {/* Κουμπί δημιουργίας (μόνο για επιχειρήσεις) */}
      {userRole === "business" && (
        <>
          <button
            onClick={openCreateModal}
            aria-label="Δημιουργία νέας προσφοράς ή εκδήλωσης"
            title="Δημιουργία νέας προσφοράς ή εκδήλωσης"
            style={{
              position: "fixed",
              bottom: 30,
              right: 30,
              width: 56,
              height: 56,
              borderRadius: "50%",
              backgroundColor: "#191919",
              color: "#fff",
              fontSize: 36,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
              zIndex: 10000,
              userSelect: "none",
            }}
          >
            +
          </button>

          {/* Modal overlay */}
          <div
            onClick={() => !submitting && setModalOpen(false)}
            style={{
              display: modalOpen ? "flex" : "none",
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 11000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 24,
                width: "90%",
                maxWidth: 400,
                boxSizing: "border-box",
                boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: 16 }}>
                Δημιουργία νέας {modalType === "offer" ? "Προσφοράς" : "Εκδήλωσης"}
              </h2>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label>
                  Τίτλος:
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", padding: 8, fontSize: 16 }}
                    disabled={submitting}
                    autoFocus
                  />
                </label>
                <label>
                  Περιγραφή:
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    style={{ width: "100%", padding: 8, fontSize: 16, resize: "vertical" }}
                    disabled={submitting}
                  />
                </label>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => !submitting && setModalOpen(false)}
                    disabled={submitting}
                    style={{
                      padding: "8px 16px",
                      fontSize: 16,
                      cursor: "pointer",
                      borderRadius: 6,
                      border: "1px solid #888",
                      backgroundColor: "#f0f0f0",
                    }}
                  >
                    Ακύρωση
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: "8px 20px",
                      fontSize: 16,
                      cursor: submitting ? "wait" : "pointer",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "#191919",
                      color: "#fff",
                      fontWeight: "600",
                    }}
                  >
                    {submitting ? "Αποστολή..." : "Αποθήκευση"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
