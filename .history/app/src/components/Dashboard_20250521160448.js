import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import {
  deleteUser,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("No authenticated user");
      return;
    }

    const password = prompt(
      "Please enter your password to confirm account deletion:"
    );
    if (!password) return;

    const credential = EmailAuthProvider.credential(user.email, password);

    try {
      setProcessingDelete(true);
      await reauthenticateWithCredential(user, credential);
      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);
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

  // Shared button style matching ProfileBuilder & MainPage style
  const buttonStyle = {
    padding: "14px 50px",
    backgroundColor: "#fff",
    color: "#191919",
    border: "4px solid #111",
    borderRadius: 45,
    fontSize: 22,
    cursor: "pointer",
    fontFamily: "'EB Garamond', serif",
    fontWeight: 400,
    minWidth: 160,
    maxWidth: 240,
    flexGrow: 1,
    transition: "background-color 0.3s",
  };

  const buttonHoverStyle = {
    backgroundColor: "#eee",
  };

  // Simple button component to handle hover styles
  function StyledButton({ onClick, disabled, children, title }) {
    const [hover, setHover] = React.useState(false);
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          ...buttonStyle,
          ...(hover && !disabled ? buttonHoverStyle : {}),
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <>
      <header
        style={{ textAlign: "center", paddingTop: 28, paddingBottom: 0 }}
      >
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
                      {typeof value === "string"
                        ? value
                        : JSON.stringify(value)}
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
            gap: 20,
            marginTop: 30,
            flexWrap: "wrap",
          }}
        >
          <StyledButton onClick={() => navigate("/mainpage")}>
            Go to Homepage
          </StyledButton>

          <StyledButton onClick={handleLogout}>Log Out</StyledButton>

          <StyledButton
            onClick={handleDeleteAccount}
            disabled={processingDelete}
            title={processingDelete ? "Deleting account..." : "Delete Account"}
          >
            {processingDelete ? "Deleting..." : "Delete Account"}
          </StyledButton>
        </div>
      </div>
    </>
  );
}
