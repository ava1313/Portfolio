// src/components/ProfileBuilder.js
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { Autocomplete, GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "./GoogleMapsLoader"; // correct hook import
import categoriesData from "../data/categories";


const inputStyle = {
  width: "100%",
  padding: 8,
  fontSize: 14,
  borderRadius: 6,
  border: "1px solid #ccc",
  boxSizing: "border-box",
};


const libraries = ["places"];
const containerStyle = {
  width: "100%",
  height: "300px",
  marginTop: 20,
  marginBottom: 20,
  borderRadius: 12,
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
};
const defaultCenter = { lat: 37.9838, lng: 23.7275 }; // Athens default

const inputStyle = {
  width: "100%",
  padding: 8,
  fontSize: 14,
  borderRadius: 6,
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

const flattenCategories = () =>
  categoriesData.flatMap((cat) => [cat.name, ...cat.subcategories]);

export default function ProfileBuilder() {
  const navigate = useNavigate();
  const { isLoaded, loadError } = useGoogleMaps();

  const [role, setRole] = useState("");
  const [form, setForm] = useState({});
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPos, setMarkerPos] = useState(null);

  const clientAutoCompleteRef = useRef(null);
  const businessAutoCompleteRef = useRef(null);

  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const allCategories = flattenCategories();

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
    const { name, value } = e.target;

    if (name === "businessCategory") {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (value.length > 0) {
        const filtered = allCategories
          .filter((cat) => cat.toLowerCase().includes(value.toLowerCase()))
          .slice(0, 5);
        setCategorySuggestions(filtered);
      } else {
        setCategorySuggestions([]);
      }
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectCategory = (cat) => {
    setForm((prev) => ({ ...prev, businessCategory: cat }));
    setCategorySuggestions([]);
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

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: 20,
        border: "1px solid #ccc",
        borderRadius: 12,
        backgroundColor: "#fff",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        position: "relative",
      }}
    >
      <img
        src="/logo.png"
        alt="Logo"
        style={{ display: "block", margin: "0 auto 30px", width: 150 }}
      />

      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        Complete Your Profile
      </h2>

      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 15 }}>
          I am a:
          <select
            name="roleSelect"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setForm({});
              setMarkerPos(null);
              setMapCenter(defaultCenter);
              setCategorySuggestions([]);
            }}
            required
            style={{ width: "100%", padding: 8, marginTop: 6 }}
          >
            <option value="">Select role</option>
            <option value="client">Client</option>
            <option value="business">Business</option>
          </select>
        </label>

        {role === "client" && (
          <>
            <label style={{ display: "block", marginBottom: 12 }}>
              First Name:
              <input
                name="firstName"
                type="text"
                onChange={onChange}
                required
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Surname:
              <input
                name="surname"
                type="text"
                onChange={onChange}
                required
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Username:
              <input
                name="username"
                type="text"
                onChange={onChange}
                required
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Birthday:
              <input
                name="birthday"
                type="date"
                onChange={onChange}
                required
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Gender:
              <select
                name="gender"
                onChange={onChange}
                required
                style={inputStyle}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_say">Prefer not to say</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: 12 }}>
              Location:
              <Autocomplete onLoad={onLoadClient} onPlaceChanged={onPlaceChangedClient}>
                <input
                  name="location"
                  type="text"
                  value={form.location || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  required
                  style={inputStyle}
                  placeholder="Start typing your location"
                />
              </Autocomplete>
            </label>
          </>
        )}

        {role === "business" && (
          <>
            <label style={{ display: "block", marginBottom: 12 }}>
              Business Name:
              <input
                name="businessName"
                type="text"
                onChange={onChange}
                required
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Business Logo URL:
              <input
                name="businessLogo"
                type="url"
                onChange={onChange}
                placeholder="Link to logo image"
                style={inputStyle}
              />
            </label>
            <label
              style={{ display: "block", marginBottom: 12, position: "relative" }}
            >
              Location:
              <Autocomplete
                onLoad={onLoadBusiness}
                onPlaceChanged={onPlaceChangedBusiness}
              >
                <input
                  name="businessLocation"
                  type="text"
                  value={form.businessLocation || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, businessLocation: e.target.value }))
                  }
                  required
                  style={inputStyle}
                  placeholder="Start typing business location"
                />
              </Autocomplete>
            </label>

            <label style={{ display: "block", marginBottom: 12 }}>
              ΑΦΜ (Tax ID):
              <input
                name="taxId"
                type="text"
                onChange={onChange}
                required
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Business Type:
              <input
                name="businessType"
                type="text"
                onChange={onChange}
                required
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Business Category:
              <input
                name="businessCategory"
                type="text"
                onChange={onChange}
                value={form.businessCategory || ""}
                required
                autoComplete="off"
                placeholder="Start typing category"
                style={inputStyle}
              />
              {categorySuggestions.length > 0 && (
                <ul
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    borderRadius: "0 0 6px 6px",
                    maxHeight: "140px",
                    overflowY: "auto",
                    zIndex: 10,
                    margin: 0,
                    padding: "5px 0",
                    listStyle: "none",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  {categorySuggestions.map((cat, idx) => (
                    <li
                      key={idx}
                      onClick={() => selectCategory(cat)}
                      style={{ padding: "6px 12px", cursor: "pointer" }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
            </label>

            <label style={{ display: "block", marginBottom: 12 }}>
              Contact Emails (comma separated):
              <input
                name="contactEmails"
                type="text"
                onChange={onChange}
                placeholder="email1@example.com, email2@example.com"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Contact Phones (comma separated):
              <input
                name="contactPhones"
                type="text"
                onChange={onChange}
                placeholder="+30 210..."
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Fax:
              <input
                name="fax"
                type="text"
                onChange={onChange}
                placeholder="Optional"
                style={inputStyle}
              />
            </label>
            <label style={{ display: "block", marginBottom: 12 }}>
              Keywords (optional):
              <input
                name="keywords"
                type="text"
                onChange={onChange}
                placeholder="comma separated"
                style={inputStyle}
              />
            </label>
          </>
        )}

        {markerPos && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={14}
          >
            <Marker position={markerPos} />
          </GoogleMap>
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
            width: "100%",
          }}
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}


