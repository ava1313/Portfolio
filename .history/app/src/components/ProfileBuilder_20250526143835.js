import React, { useState, useRef, useEffect } from "react";
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
  const [markerPos, setMarkerPos] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isValid, setIsValid] = useState(false);
  const [modalMessage, setModalMessage] = useState(""); // modal message state

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

  useEffect(() => {
    if (role === "client") {
      const requiredClientFields = [
        "firstName",
        "surname",
        "username",
        "birthday",
        "gender",
        "location",
      ];
      setIsValid(
        requiredClientFields.every(
          (field) => form[field] && form[field].toString().trim() !== ""
        )
      );
    } else if (role === "business") {
      const requiredBusinessFields = [
        "businessName",
        "businessLocation",
        "taxId",
        "businessType",
        "businessCategory",
        "companyDescription",
        "keywords",
        "googleMapsUrl",
      ];
      setIsValid(
        requiredBusinessFields.every(
          (field) => form[field] && form[field].toString().trim() !== ""
        )
      );
    } else {
      setIsValid(false);
    }
  }, [role, form]);

  const closeModal = () => setModalMessage("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid) {
      setModalMessage("Please fill all required fields.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setModalMessage("No authenticated user.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { role, profile: form }, { merge: true });
      setModalMessage("Profile saved!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error(err);
      setModalMessage("Error saving profile.");
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
          maxWidth: 600,
          margin: "40px auto",
          padding: "0 16px",
          boxSizing: "border-box",
          fontFamily: "'EB Garamond', serif",
          color: "#191919",
          border: "1px solid #ccc",
          borderRadius: 12,
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
        }}
      >
        <h2 style={{ marginBottom: 24, textAlign: "center" }}>
          Complete Your Profile
        </h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 20 }}
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
              <label>
                First Name:
                <input
                  name="firstName"
                  type="text"
                  onChange={onChange}
                  required
                  style={inputStyle}
                />
              </label>
              <label>
                Surname:
                <input
                  name="surname"
                  type="text"
                  onChange={onChange}
                  required
                  style={inputStyle}
                />
              </label>
              <label>
                Username:
                <input
                  name="username"
                  type="text"
                  onChange={onChange}
                  required
                  style={inputStyle}
                />
              </label>
              <label>
                Birthday:
                <input
                  name="birthday"
                  type="date"
                  onChange={onChange}
                  required
                  style={inputStyle}
                />
              </label>
              <label>
                Gender:
                <select
                  name="gender"
                  onChange={onChange}
                  required
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_say">Prefer not to say</option>
                </select>
              </label>
              <label style={{ marginBottom: 24 }}>
                Location:
                <Autocomplete onLoad={onLoadClient} onPlaceChanged={onPlaceChangedClient}>
                  <input
                    name="location"
                    type="text"
                    value={form.location || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
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
              <label>
                Business Name:
                <input
                  name="businessName"
                  type="text"
                  onChange={onChange}
                  required
                  style={inputStyle}
                />
              </label>
              <label>
                Business Logo URL:
                <input
                  name="businessLogo"
                  type="url"
                  onChange={onChange}
                  placeholder="Link to logo image"
                  style={inputStyle}
                />
              </label>
              <label>
                Location:
                <Autocomplete onLoad={onLoadBusiness} onPlaceChanged={onPlaceChangedBusiness}>
                  <input
                    name="businessLocation"
                    type="text"
                    value={form.businessLocation || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, businessLocation: e.target.value }))}
                    required
                    style={inputStyle}
                    placeholder="Start typing business location"
                  />
                </Autocomplete>
              </label>
              <label>
                Google Maps URL:
                <input
                  name="googleMapsUrl"
                  type="url"
                  onChange={(e) => setForm((prev) => ({ ...prev, googleMapsUrl: e.target.value.trim() }))}
                  placeholder="Paste your Google Maps URL here"
                  style={inputStyle}
                  value={form.googleMapsUrl || ""}
                  required
                />
              </label>
              <label>
                ΑΦΜ (Tax ID):
                <input
                  name="taxId"
                  type="text"
                  onChange={onChange}
                  required
                  style={inputStyle}
                />
              </label>
              <label>
                Business Type:
                <select
                  name="businessType"
                  value={form.businessType || ""}
                  onChange={onChange}
                  required
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="" disabled>
                    Select business type
                  </option>
                  <option value="Απλή Επιχείρηση">Απλή Επιχείρηση</option>
                  <option value="Κυριλέ Επιχείρηση">Κυριλέ Επιχείρηση</option>
                  <option value="Εμπορική Επιχείρηση">Εμπορική Επιχείρηση</option>
                  <option value="Νεοφυής Επιχείρηση">Νεοφυής Επιχείρηση</option>
                  <option value="Άλλη">Άλλη</option>
                </select>
              </label>
              <label>
                Business Category:
                <select
                  name="businessCategory"
                  value={form.businessCategory || ""}
                  onChange={onChange}
                  required
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {allCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Company Description:
                <textarea
                  name="companyDescription"
                  value={form.companyDescription || ""}
                  onChange={onChange}
                  placeholder="Write a brief description about your company and services"
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" }}
                  required
                />
              </label>
              <label>
                Keywords:
                <input
                  name="keywords"
                  type="text"
                  onChange={onChange}
                  placeholder="Comma separated keywords"
                  style={inputStyle}
                  value={form.keywords || ""}
                  required
                />
              </label>
              <label>
                Contact Emails (comma separated):
                <input
                  name="contactEmails"
                  type="text"
                  onChange={onChange}
                  placeholder="email1@example.com, email2@example.com"
                  style={inputStyle}
                  value={form.contactEmails || ""}
                />
              </label>
              <label>
                Contact Phones (comma separated):
                <input
                  name="contactPhones"
                  type="text"
                  onChange={onChange}
                  placeholder="+30 210..."
                  style={inputStyle}
                  value={form.contactPhones || ""}
                />
              </label>
              <label>
                Fax:
                <input
                  name="fax"
                  type="text"
                  onChange={onChange}
                  placeholder="Optional"
                  style={inputStyle}
                  value={form.fax || ""}
                />
              </label>
            </>
          )}

          {markerPos && (
            <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={14}>
              <Marker position={markerPos} />
            </GoogleMap>
          )}

          {isValid && (
            <button
              type="submit"
              style={{
                marginTop: 10,
                marginBottom: 30,
                padding: "14px 50px",
                backgroundColor: "#191919",
                color: "#fff",
                border: "none",
                borderRadius: 24,
                fontSize: 22,
                cursor: "pointer",
                fontFamily: "'EB Garamond', serif",
                fontWeight: 400,
                alignSelf: "center",
                transition: "background-color 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#444")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#191919")}
            >
              Save Profile
            </button>
          )}
        </form>
      </div>

      {/* Modal implementation exactly as your existing code style */}
      {modalMessage && (
        <div
          role="alertdialog"
          aria-modal="true"
          tabIndex={-1}
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 15000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              maxWidth: 360,
              fontSize: 18,
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              textAlign: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            <p style={{ marginBottom: 20 }}>{modalMessage}</p>
            <button
              onClick={closeModal}
              style={{
                padding: "8px 28px",
                borderRadius: 6,
                border: "none",
                backgroundColor: "#191919",
                color: "#fff",
                cursor: "pointer",
                fontSize: 16,
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
