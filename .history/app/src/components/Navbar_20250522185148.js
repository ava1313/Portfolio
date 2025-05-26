import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Navbar() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // "offer" or "event"

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
      if (userDoc.exists()) setUserRole(userDoc.data().role);
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
    const choice = window.prompt("1 για Προσφορά\n2 για Εκδήλωση");
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
      const colPath =
        modalType === "offer" ? "offers" : modalType === "event" ? "events" : null;
      if (!colPath) throw new Error("Άγνωστος τύπος δημιουργίας.");

      const colRef = collection(db, "users", userId, colPath);
      await addDoc(colRef, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        timestamp: serverTimestamp(),
        attendees: modalType === "event" ? [] : undefined,
      });
      alert(`${modalType === "offer" ? "Προσφορά" : "Εκδήλωση"} δημιουργήθηκε!`);
      setModalOpen(false);
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
        {/* Αριστερά: Map, Offers, Events */}
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
            {/* Map Icon SVG */}
            {/* ... */}
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
            {/* Offers Icon SVG */}
            {/* ... */}
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
            {/* Events Icon SVG */}
            {/* ... */}
          </div>
        </div>

        {/* Κέντρο: Logo */}
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

        {/* Δεξιά: Profile + Favorites */}
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
          {/* Profile */}
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
            {/* Profile Icon SVG */}
            {/* ... */}
          </div>
          {/* Favorites */}
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
            {/* Favorites Icon SVG */}
            {/* ... */}
          </div>
        </div>
      </header>

      {/* Floating create button για επιχειρήσεις */}
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

          {/* Modal */}
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
