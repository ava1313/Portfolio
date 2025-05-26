import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import "./style.css";

export default function BusinessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [biz, setBiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBusiness() {
      const docRef = doc(db, "users", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setBiz(null);
      } else {
        const data = docSnap.data();
        if (data.role !== "business") setBiz(null);
        else setBiz(data.profile || {});
      }
      setLoading(false);
    }
    fetchBusiness();
  }, [id]);

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: 80 }}>Φόρτωση...</div>
    );

  if (!biz)
    return (
      <div style={{ textAlign: "center", marginTop: 120, color: "#d00" }}>
        <h2>Η επιχείρηση δεν βρέθηκε.</h2>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            borderRadius: 22,
            background: "#333",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Επιστροφή στα αποτελέσματα
        </button>
      </div>
    );

  return (
    <div
      style={{
        maxWidth: 700,
        height: "calc(100vh - 80px)",
        margin: "40px auto",
        padding: "24px 20px",
        boxSizing: "border-box",
        overflowY: "auto",
        fontFamily: "'EB Garamond', serif",
        color: "#191919",
        borderRadius: 12,
        backgroundColor: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Logo */}
      <img
        src={biz.businessLogo || "/placeholder-logo.png"}
        alt={biz.businessName}
        style={{
          width: 120,
          height: 120,
          borderRadius: 24,
          border: "2.5px solid #f1f1f1",
          objectFit: "cover",
          background: "#f7f7f7",
          marginBottom: 28,
          boxShadow: "0 2px 16px rgba(40,70,120,0.09)",
        }}
        onError={(e) => {
          e.target.src = "/placeholder-logo.png";
        }}
      />

      {/* Name */}
      <h1
        style={{
          fontWeight: 700,
          fontSize: 32,
          margin: "0 0 16px 0",
          textAlign: "center",
        }}
      >
        {biz.businessName}
      </h1>

      {/* Small description */}
      {biz.companyDescription && (
        <p
          style={{
            fontSize: 18,
            fontStyle: "italic",
            color: "#555",
            textAlign: "center",
            marginBottom: 24,
            maxWidth: 600,
            lineHeight: 1.5,
          }}
        >
          {biz.companyDescription}
        </p>
      )}

      {/* Location */}
      <div
        style={{
          textAlign: "center",
          fontSize: 17,
          color: "#666",
          marginBottom: 24,
          maxWidth: 600,
        }}
      >
        {biz.businessLocation}
      </div>

      {/* Interactive Map */}
      {biz.businessLocation && (
        <iframe
          title="Business Location"
          width="100%"
          height="270"
          frameBorder="0"
          style={{
            borderRadius: 16,
            boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
            marginBottom: 30,
          }}
          src={`https://www.google.com/maps?q=${encodeURIComponent(
            biz.businessLocation
          )}&output=embed`}
          allowFullScreen
        />
      )}

      {/* Contacts */}
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontSize: 16,
          color: "#191919",
          marginBottom: 28,
        }}
      >
        {biz.contactEmails && (
          <div>
            <b>Email:</b>{" "}
            {biz.contactEmails.split(",").map((mail, i) => (
              <a
                href={`mailto:${mail.trim()}`}
                key={i}
                style={{ color: "#285090", textDecoration: "underline", marginRight: 8 }}
              >
                {mail.trim()}
              </a>
            ))}
          </div>
        )}
        {biz.contactPhones && (
          <div>
            <b>Τηλ:</b>{" "}
            {biz.contactPhones.split(",").map((phone, i) => (
              <span key={i} style={{ marginRight: 10 }}>
                {phone.trim()}
              </span>
            ))}
          </div>
        )}
        {biz.fax && (
          <div>
            <b>Fax:</b> <span>{biz.fax}</span>
          </div>
        )}
      </div>

      {/* Services / Keywords */}
      {biz.keywords && (
        <div
          style={{
            fontSize: 15,
            color: "#4682b4",
            fontStyle: "italic",
            textAlign: "center",
            marginBottom: 40,
            maxWidth: 600,
          }}
        >
          {biz.keywords}
        </div>
      )}

      {/* Placeholder for Google Reviews */}
      {/* TODO: Integrate Google Places API to fetch and display reviews */}

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: "12px 28px",
          background: "#191919",
          color: "#fff",
          border: "none",
          borderRadius: 24,
          fontSize: 18,
          cursor: "pointer",
          fontFamily: "'EB Garamond', serif",
          alignSelf: "center",
          marginBottom: 30,
          minWidth: 160,
        }}
      >
        Επιστροφή στα αποτελέσματα
      </button>
    </div>
  );
}
