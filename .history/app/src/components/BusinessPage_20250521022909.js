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

  if (loading) return <div style={{ textAlign: "center", marginTop: 80 }}>Φόρτωση...</div>;
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
            cursor: "pointer"
          }}
        >
          Επιστροφή στα αποτελέσματα
        </button>
      </div>
    );

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "36px 0" }}>
      {/* Logo Centered */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img
          src={biz.businessLogo || "/placeholder-logo.png"}
          alt={biz.businessName}
          style={{
            width: 108,
            height: 108,
            borderRadius: "24px",
            border: "2.5px solid #f1f1f1",
            objectFit: "cover",
            background: "#f7f7f7",
            marginBottom: 20,
            boxShadow: "0 2px 16px rgba(40,70,120,0.09)"
          }}
          onError={e => { e.target.src = "/placeholder-logo.png"; }}
        />
      </div>
      {/* Name, Category, Location */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontWeight: 700, fontSize: 32, margin: "10px 0" }}>{biz.businessName}</h1>
        <div style={{ color: "#555", fontSize: 19, marginBottom: 7 }}>
          <b>{biz.businessCategory}</b> | {biz.businessType}
        </div>
        <div style={{ color: "#888", fontSize: 16, marginBottom: 18 }}>
          {biz.businessLocation}
        </div>
        {biz.keywords && (
          <div
            style={{
              color: "#4682b4",
              fontSize: 15,
              marginBottom: 8,
              fontStyle: "italic"
            }}
          >
            {biz.keywords}
          </div>
        )}
      </div>
      {/* Contact Info */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: 22,
        gap: 5
      }}>
        {biz.contactEmails && (
          <div>
            <b>Email:</b>{" "}
            {biz.contactEmails.split(",").map((mail, i) => (
              <a
                href={`mailto:${mail.trim()}`}
                key={i}
                style={{
                  color: "#285090",
                  textDecoration: "underline",
                  marginRight: 8
                }}
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
      {/* (Optional) Tax ID */}
      {biz.taxId && (
        <div style={{ textAlign: "center", color: "#888", marginBottom: 24 }}>
          <b>ΑΦΜ:</b> {biz.taxId}
        </div>
      )}

      {/* (Optional) Google Map Preview */}
      {biz.businessLocation && (
        <iframe
          title="Business Location"
          width="100%"
          height="270"
          frameBorder="0"
          style={{
            borderRadius: 16,
            boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
            margin: "0 0 28px 0"
          }}
          src={`https://www.google.com/maps?q=${encodeURIComponent(
            biz.businessLocation
          )}&output=embed`}
          allowFullScreen
        />
      )}

      {/* Go Back Button */}
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "10px 28px",
            background: "#4285F4",
            color: "white",
            border: "none",
            borderRadius: 22,
            fontSize: 17,
            cursor: "pointer"
          }}
        >
          Επιστροφή στα αποτελέσματα
        </button>
      </div>
    </div>
  );
}
