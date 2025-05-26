import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import ProfileBuilder from "./components/ProfileBuilder";
import Dashboard from "./components/Dashboard";
import MainPage from "./components/MainPage";  // Import your MainPage
import { auth } from "./firebase";

// Protect routes that require login
function PrivateRoute({ children }) {
  return auth.currentUser ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/mainpage" element={<MainPage />} />

      {/* Protected routes */}
      <Route
        path="/profile-builder"
        element={
          <PrivateRoute>
            <ProfileBuilder />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* Redirect unknown paths */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
