// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import ProfileBuilder from "./components/ProfileBuilder";
import Dashboard from "./components/Dashboard";
import MainPage from "./components/MainPage";
import ResultsPage from "./components/ResultsPage"; // Import results page
import { auth } from "./firebase";

function PrivateRoute({ children }) {
  return auth.currentUser ? children : <Navigate to="/" />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/mainpage" element={<MainPage />} />
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
      <Route path="/results" element={<ResultsPage />} /> {/* New route */}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
