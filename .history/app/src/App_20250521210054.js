import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import ProfileBuilder from "./components/ProfileBuilder";
import Dashboard from "./components/Dashboard";
import MainPage from "./components/MainPage";
import ResultsPage from "./components/ResultsPage";
import BusinessPage from "./components/BusinessPage";
import FavoritesPage from "./components/FavoritesPage";
import BusinessesMap from "./components/BusinessesMap"; // <-- import your map component
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
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/business/:id" element={<BusinessPage />} />

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
      <Route
        path="/favorites"
        element={
          <PrivateRoute>
            <FavoritesPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/businessesmap"
        element={
          <PrivateRoute>
            <BusinessesMap />
          </PrivateRoute>
        }
      />

      {/* Redirect unknown paths */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
