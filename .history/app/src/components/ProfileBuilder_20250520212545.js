import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function ProfileBuilder() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [extraInfo, setExtraInfo] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) return alert("Please select a role.");

    const user = auth.currentUser;
    if (!user) return alert("No authenticated user.");

    const userRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userRef, { role, extraInfo });
      alert("Profile saved!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error saving profile.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Complete your profile</h2>
      <form onSubmit={handleSubmit}>
        <label>
          I am a:
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select role</option>
            <option value="client">Client</option>
            <option value="business">Business</option>
          </select>
        </label>
        <br /><br />
        <label>
          Extra info:
          <input
            type="text"
            value={extraInfo}
            onChange={(e) => setExtraInfo(e.target.value)}
            placeholder="Add your details here"
          />
        </label>
        <br /><br />
        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
}
