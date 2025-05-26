import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // Removed storage import
import {
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  signOut,
  deleteUser,
} from "firebase/auth";

import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

import Navbar from "./Navbar";

const roleLabels = {
  user: "Regular User",
  business: "Business Owner",
  admin: "Administrator",
};

const formatKey = (key) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

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
          const data = docSnap.data();
          setUserData(data);
          setFormData(data.profile || {});
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
      setLoading(false);
    }
    fetchUserData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Validation example: require firstName or businessName
  const validate = () => {
    if (!formData.firstName && !formData.businessName) {
      setError("Please provide a First Name or Business Name.");
      return false;
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  // Reauthenticate user if email changed
  const reauthenticateUser = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");
    const providerId = user.providerData[0]?.providerId;
    if (providerId === "google.com") {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
    } else {
      const password = prompt("Please enter your password to continue:");
      if (!password) throw new Error("Reauthentication cancelled");
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    }
  };

  // Handle Save Profile
  const handleSave = async () => {
    setError(null);
    if (!validate()) return;
    setProcessing(true);

    const user = auth.currentUser;
    if (!user) {
      setError("No authenticated user.");
      setProcessing(false);
      return;
    }

    try {
      // If email changed, update in Firebase Auth (requires reauth)
      if (formData.email && formData.email !== user.email) {
        await reauthenticateUser();
        await updateEmail(user, formData.email);
      }

      // Update Firestore profile with form data (no image upload)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        profile: { ...formData },
      });

      // Refresh local state
      setUserData((prev) => ({
        ...prev,
        profile: { ...formData },
      }));
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile.");
    }
    setProcessing(false);
  };

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

    try {
      setProcessing(true);

      const providerId = user.providerData[0]?.providerId;
      if (providerId === "google.com") {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      } else {
        const password = prompt(
          "Please enter your password to confirm account deletion:"
        );
        if (!password) {
          setProcessing(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }

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
      setProcessing(false);
    }
  };

  const buttonStyle = {
    padding: "10px 30px",
    backgroundColor: "#fff",
    color: "#191919",
    border: "3px solid #111",
    borderRadius: 30,
    fontSize: 16,
    cursor: processing ? "wait" : "pointer",
    fontFamily: "'EB Garamond', serif",
    fontWeight: 400,
    minWidth: 130,
    maxWidth: 180,
    flexGrow: 1,
    transition: "background-color 0.3s",
    opacity: processing ? 0.6 : 1,
  };
  const buttonHoverStyle = { backgroundColor: "#eee" };

  function StyledButton({ onClick, disabled, children, title }) {
    const [hover, setHover] = React.useState(false);
    return (
      <button
        onClick={onClick}
        disabled={disabled || processing}
        title={title}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          ...buttonStyle,
          ...(hover && !disabled && !processing ? buttonHoverStyle : {}),
          opacity: disabled || processing ? 0.6 : 1,
          cursor: disabled || processing ? "not-allowed" : "pointer",
        }}
      >
        {children}
      </button>
    );
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          Loading dashboard...
        </div>
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          No user data found. Please complete your profile.
        </div>
      </>
    );
  }

  const { role, profile } = userData;

  return (
    <>
      <Navbar />

      <div
        style={{
          maxWidth: 700,
          margin: "40px auto",
          padding: "0 16px 40px",
          boxSizing: "border-box",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          color: "#191919",
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
          <strong>Role: </strong>
          <span
            style={{
              backgroundColor: "#191919",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {roleLabels[role] || role}
          </span>
        </p>

        {error && (
          <div
            style={{
              backgroundColor: "#fdd",
              color: "#900",
              padding: "10px 15px",
              borderRadius: 10,
              marginTop: 10,
              fontWeight: "600",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {!editMode ? (
          <>
            <section
              style={{
                marginTop: 20,
                paddingRight: 8,
              }}
            >
              <h2>Your Profile Details</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
                <tbody>
                  {profile &&
                    Object.entries(profile)
                      .filter(([key]) => key.toLowerCase() !== "surname") // exclude surname to avoid duplicate last names
                      .map(([key, value]) => (
                      <tr key={key} style={{ borderBottom: "1px solid #ddd" }}>
                        <td
                          style={{
                            padding: "8px 12px",
                            fontWeight: "600",
                            textTransform: "capitalize",
                            width: "40%",
                            verticalAlign: "top",
                          }}
                        >
                          {formatKey(key)}
                        </td>
                        <td style={{ padding: "8px 12px", wordBreak: "break-word" }}>
                          {typeof value === "string"
                            ? value
                            : JSON.stringify(value, null, 2)}
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
                gap: 16,
                marginTop: 30,
                flexWrap: "wrap",
              }}
            >
              <StyledButton onClick={() => setEditMode(true)}>Edit Profile</StyledButton>
              <StyledButton onClick={() => navigate("/mainpage")}>Go to Homepage</StyledButton>
              <StyledButton onClick={handleLogout}>Log Out</StyledButton>
              <StyledButton
                onClick={handleDeleteAccount}
                disabled={processing}
                title={processing ? "Deleting account..." : "Delete Account"}
              >
                {processing ? "Deleting..." : "Delete Account"}
              </StyledButton>
            </div>
          </>
        ) : (
          <>
            <section style={{ marginTop: 20 }}>
              <h2>Edit Profile</h2>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleSave();
                }}
              >
                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="email" style={{ display: "block", marginBottom: 6 }}>
                    Email (required)
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email || auth.currentUser.email}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: 10, fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>

                {/* Conditionally show firstName or businessName based on role */}
                {role === "business" ? (
                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="businessName" style={{ display: "block", marginBottom: 6 }}>
                      Business Name (required)
                    </label>
                    <input
                      type="text"
                      id="businessName"
                      name="businessName"
                      required
                      value={formData.businessName || ""}
                      onChange={handleInputChange}
                      style={{ width: "100%", padding: 10, fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
                    />
                  </div>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    <label htmlFor="firstName" style={{ display: "block", marginBottom: 6 }}>
                      First Name (required)
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName || ""}
                      onChange={handleInputChange}
                      style={{ width: "100%", padding: 10, fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
                    />
                  </div>
                )}

                {/* Last Name */}
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="lastName" style={{ display: "block", marginBottom: 6 }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName || ""}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: 10, fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>

                {/* Phone */}
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="phone" style={{ display: "block", marginBottom: 6 }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    style={{ width: "100%", padding: 10, fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>

                {/* Submit and Cancel */}
                <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                  <StyledButton type="submit" disabled={processing}>
                    {processing ? "Saving..." : "Save Changes"}
                  </StyledButton>
                  <StyledButton
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setError(null);
                      setFormData(userData.profile || {});
                    }}
                    disabled={processing}
                  >
                    Cancel
                  </StyledButton>
                </div>
              </form>
            </section>
          </>
        )}
      </div>
    </>
  );
}
