import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { deleteUser, signOut, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingDelete, setProcessingDelete] = useState(false);

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
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        Loading dashboard...
      </div>
    );
  }

  if (!userData) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        No user data found. Please complete your profile.
      </div>
    );
  }

  const { role, profile } = userData;

  // Log out handler
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Delete account handler with reauthentication
  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("No authenticated user");
      return;
    }

    // Ask for password to reauthenticate
    const password = prompt("Please enter your password to confirm account deletion:");
    if (!password) return;

    const credential = EmailAuthProvider.credential(user.email, password);

    try {
      setProcessingDelete(true);
      await reauthenticateWithCredential(user, credential);
      // Delete Firestore user document
      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);
      // Delete Auth user
      await deleteUser(user);
      alert("Account deleted successfully");
      navigate("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      if (error.code === "auth/requires-recent-login") {
        alert("Please log in again and retry deleting your account.");
      } else {
        alert("Error deleting account: " + error.message);
      }
    } finally {
      setProcessingDelete(false);
    }
  };

  return (
    <>
      <header style={{ textAlign: "center", paddingTop: 28, paddingBottom: 0 }}>
        <img
          src="/logo.png"
          alt="freedome logo"
          className="logo"
          style={{
            height: 50,
            objectFit: "contain",
            margin: "0 auto",
            display: "inline-block",
          }}
        />
      </header>

      <div
        style={{
          maxWidth: 700,
          height: "calc(100vh - 100px)",
          margin: "40px auto",
          padding: "0 16px 40px",
          boxSizing: "border-box",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: "#191919",
          overflowY: "auto",
          backgroundColor: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: 24 }}>
          Welcome {profile?.firstName || profile?.businessName || "User"}!
        </h1>

        <p>
          <strong>Role:</strong> {role}
        </p>

        <section style={{ marginTop: 20, flexGrow: 1, overflowY: "auto" }}>
          <h2>Your Profile Details</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {profile &&
                Object.entries(profile).map(([key, value]) => (
                  <tr key={key} style={{ borderBottom: "1px solid #ddd" }}>
                    <td
                      style={{
                        padding: "8px 12px",
                        fontWeight: "600",
                        textTransform: "capitalize",
                      }}
                    >
                      {key.replace(/([A-Z])/g, " $1")}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      {typeof value === "string" ? value : JSON.stringify(value)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginTop: 30,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => navigate("/mainpage")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#4285F4",
              color: "white",
              border: "none",
              borderRadius: 24,
              fontSize: 16,
              cursor: "pointer",
              flexGrow: 1,
              minWidth: 120,
              maxWidth: 200,
            }}
          >
            Go to Homepage
          </button>

          <button
            onClick={handleLogout}
            style={{
              padding: "12px 24px",
              backgroundColor: "#f39c12",
              color: "white",
              border: "none",
              borderRadius: 24,
              fontSize: 16,
              cursor: "pointer",
              flexGrow: 1,
              minWidth: 120,
              maxWidth: 200,
            }}
          >
            Log Out
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={processingDelete}
            style={{
              padding: "12px 24px",
              backgroundColor: "#e74c3c",
              color: "white",
              border: "none",
              borderRadius: 24,
              fontSize: 16,
              cursor: processingDelete ? "not-allowed" : "pointer",
              flexGrow: 1,
              minWidth: 120,
              maxWidth: 200,
              opacity: processingDelete ? 0.6 : 1,
            }}
            title={processingDelete ? "Deleting account..." : "Delete Account"}
          >
            {processingDelete ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </div>
    </>
  );
}
