import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { Autocomplete, GoogleMap, Marker } from "@react-google-maps/api";
import categories from "../data/categories";

const containerStyle = {
  width: "100%",
  height: 300,
  marginTop: 20,
  marginBottom: 20,
  borderRadius: 12,
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
};

const defaultCenter = { lat: 37.9838, lng: 23.7275 };

const inputStyle = {
  width: "100%",
  padding: "14px 20px",
  fontSize: 18,
  borderRadius: 40,
  border: "2px solid black",
  boxSizing: "border-box",
  fontFamily: "'EB Garamond', serif",
  color: "#191919",
};

const flattenCategories = () =>
  categories.flatMap((cat) => [cat.name, ...cat.subcategories]);

export default function ProfileBuilder() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [form, setForm] = useState({});
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPos, setMarkerPos] = useState(null);

  const clientAutoCompleteRef = useRef(null);
  const businessAutoCompleteRef = useRef(null);

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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) return alert("Please select a role.");

    if (role === "business") {
      if (!form.keywords || form.keywords.trim() === "") {
        return alert("Please provide keywords for your business.");
      }
      if (!form.businessType || form.businessType.trim() === "") {
        return alert("Please select your business type.");
      }
      if (!form.businessCategory || form.businessCategory.trim() === "") {
        return alert("Please select a business category.");
      }
      if (!form.companyDescription || form.companyDescription.trim() === "") {
        return alert("Please enter a company description.");
      }
    }

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

  return (
    <>
      <header>
        <img src="/logo.png" alt="freedome logo" className="logo" />
      </header>

      <main
        style={{
          maxWidth: 600,
          margin: "40px auto 60px auto",
          padding: "0 16px",
          overflowY: "auto",
          minHeight: "calc(100vh - 120px)",
          boxSizing: "border-box",
        }}
      >
        <h2 className="subtitle" style={{ marginBottom: 24, textAlign: "center" }}>
          Complete Your Profile
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          <label>
            I am a:
            <select
              name="roleSelect"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setForm({});
                setMarkerPos(null);
                setMapCenter(defaultCenter);
              }}
              required
              style={{ ...inputStyle, cursor: "pointer", marginTop: 6 }}
            >
              <option value="">Select role</option>
              <option value="client">Client</option>
              <option value="business">Business</option>
            </select>
          </label>

          {role === "client" && (
            <>
              {/* Client inputs here, styled */}
              {/* ...same as before, with inputStyle */}
            </>
          )}

          {role === "business" && (
            <>
              {/* Business inputs here, styled */}
              {/* ...same as before, with inputStyle */}
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
              padding: "20px 75px",
              backgroundColor: "#fff",
              color: "#191919",
              border: "4px solid #111",
              borderRadius: 45,
              fontSize: 30,
              cursor: "pointer",
              fontFamily: "'EB Garamond', serif",
              fontWeight: 400,
              width: "100%",
            }}
          >
            Save Profile
          </button>
        </form>
      </main>
    </>
  );
}
