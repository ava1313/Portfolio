import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useJsApiLoader, Autocomplete, GoogleMap, Marker } from "@react-google-maps/api";

const libraries = ["places"];
const containerStyle = {
  width: "100%",
  height: "300px",
  marginTop: 20,
  marginBottom: 20,
  borderRadius: 12,
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
};
const defaultCenter = { lat: 37.9838, lng: 23.7275 };

const inputStyle = {
  width: "100%",
  padding: 8,
  fontSize: 14,
  borderRadius: 6,
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

export default function ProfileBuilder() {
  const navigate = useNavigate();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [role, setRole] = useState("");
  const [form, setForm] = useState({});
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPos, setMarkerPos] = useState(null);

  const clientAutoCompleteRef = useRef(null);
  const businessAutoCompleteRef = useRef(null);

  const onLoadClient = (autocomplete) => {
    clientAutoCompleteRef.current = autocomplete;
  };

  const onLoadBusiness = (autocomplete) => {
    businessAutoCompleteRef.current = autocomplete;
  };

  const onPlaceChangedClient = () => {
    const autocomplete = clientAutoCompleteRef.current;
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name;
        setForm((prev) => ({ ...prev, location: address }));
        setMapCenter({ lat, lng });
        setMarkerPos({ lat, lng });
      }
    }
  };

  const onPlaceChangedBusiness = () => {
    const autocomplete = businessAutoCompleteRef.current;
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name;
        setForm((prev) => ({ ...prev, businessLocation: address }));
        setMapCenter({ lat, lng });
        setMarkerPos({ lat, lng });
      }
    }
  };

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) return alert("Please select a role.");

    const user = auth.currentUser;
    if (!user) return alert("No authenticated user.");

    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { role, profile: form }, { merge: true });
      alert("Profile saved!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Error saving profile.");
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

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
        {/* ... Your form inputs ... */}
        {/* For example, location input with Autocomplete */}
        {role === "client" && (
          <label style={{ display: "block", marginBottom: 12 }}>
            Location:
            <Autocomplete onLoad={onLoadClient} onPlaceChanged={onPlaceChangedClient}>
              <input
                name="location"
                type="text"
                value={form.location || ""}
                onChange={onChange}
                required
                style={inputStyle}
                placeholder="Start typing your location"
              />
            </Autocomplete>
          </label>
        )}
        {/* Similarly for business */}
        <button type="submit" style={{
          marginTop: 20,
          padding: "12px 24px",
          backgroundColor: "#4285F4",
          color: "white",
          border: "none",
          borderRadius: 24,
          fontSize: 16,
          cursor: "pointer",
          width: "100%",
        }}>Save Profile</button>
      </form>
    </div>
  );
}
