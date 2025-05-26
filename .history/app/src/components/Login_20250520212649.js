import React from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider, db } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";


// inside Login component
const navigate = useNavigate();

const login = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || userSnap.data().role === null) {
      alert("Please complete your profile.");
      navigate("/profile-builder");
    } else {
      alert(`Welcome back, ${user.displayName}`);
      navigate("/dashboard");
    }
  } catch (error) {
    console.error(error);
    alert("Login failed");
  }
};
