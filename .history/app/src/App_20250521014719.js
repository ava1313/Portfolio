
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const isAuthenticated = true; // replace with your auth logic
  return isAuthenticated ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Login Page</div>} />
      <Route path="/mainpage" element={<div>Main Page</div>} />
      <Route
        path="/profile-builder"
        element={
          <PrivateRoute>
            <div>Profile Builder</div>
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <div>Dashboard</div>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
