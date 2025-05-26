import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function ProfileBuilder() {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [form, setForm] = useState({});

  // Helper to update form state
  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // For file inputs like business logo, we’ll just store the filename for now
  // (You can later implement file upload)

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) return alert("Please select a role.");

    const user = auth.currentUser;
    if (!user) return alert("No authenticated user.");

    try {
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, { role, profile: form });
      alert("Profile saved!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error saving profile.");
    }
  };

  return (
    <div style={{
      maxWidth: 600,
      margin: "40px auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: 20,
      border: "1px solid #ccc",
      borderRadius: 12,
      backgroundColor: "#fff",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    }}>
      <img src="/logo.png" alt="Logo" style={{ display: "block", margin: "0 auto 30px", width: 150 }} />

      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Complete Your Profile</h2>

      <form onSubmit={handleSubmit}>

        {/* Role select */}
        <label style={{ display: "block", marginBottom: 15 }}>
          I am a:
          <select
            name="roleSelect"
            value={role}
            onChange={(e) => { setRole(e.target.value); setForm({}); }}
            required
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          >
            <option value="">Select role</option>
            <option value="client">Client</option>
            <option value="business">Business</option>
          </select>
        </label>

        {/* Client fields */}
        {role === "client" && (
          <>
            <label style={{ display: "block", marginBottom: 12 }}>
              First Name:
              <input name="firstName" type="text" onChange={onChange} required style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Surname:
              <input name="surname" type="text" onChange={onChange} required style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Username:
              <input name="username" type="text" onChange={onChange} required style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Birthday:
              <input name="birthday" type="date" onChange={onChange} required style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Gender:
              <select name="gender" onChange={onChange} required style={inputStyle}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_say">Prefer not to say</option>
              </select>
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Location:
              <input name="location" type="text" onChange={onChange} required style={inputStyle} />
            </label>
          </>
        )}

        {/* Business fields */}
        {role === "business" && (
          <>
            <label style={{ display: "block", marginBottom: 12 }}>
              Business Name:
              <input name="businessName" type="text" onChange={onChange} required style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Business Logo URL:
              <input name="businessLogo" type="url" onChange={onChange} placeholder="Link to logo image" style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Location:
              <input name="businessLocation" type="text" onChange={onChange} required style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              ΑΦΜ (Tax ID):
              <input name="taxId" type="text" onChange={onChange} required style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Business Type:
              <input name="businessType" type="text" onChange={onChange} required style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Business Category:
              <input name="businessCategory" type="text" onChange={onChange} required style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Contact Emails (comma separated):
              <input name="contactEmails" type="text" onChange={onChange} placeholder="email1@example.com, email2@example.com" style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Contact Phones (comma separated):
              <input name="contactPhones" type="text" onChange={onChange} placeholder="+30 210..." style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Fax:
              <input name="fax" type="text" onChange={onChange} placeholder="Optional" style={inputStyle} />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Keywords (optional):
              <input name="keywords" type="text" onChange={onChange} placeholder="comma separated" style={inputStyle} />
            </label>
          </>
        )}

        <button
          type="submit"
          style={{
            marginTop: 20,
            padding: "12px 24px",
            backgroundColor: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: 24,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 8,
  fontSize: 14,
  borderRadius: 6,
  border: "1px solid #ccc",
  boxSizing: "border-box",
};
