import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./components/Login";
import ProfileBuilder from "./components/ProfileBuilder";
import Dashboard from "./components/Dashboard";
import MainPage from "./components/MainPage";
import ResultsPage from "./components/ResultsPage";
import BusinessPage from "./components/BusinessPage";
import FavoritesPage from "./components/FavoritesPage";
import BusinessesMap from "./components/BusinessesMap";
import OffersPage from "./components/OffersPage";
import EventsPage from "./components/EventsPage";
import { auth } from "./firebase"; // NOW CORRECT!

// Save location for after-login redirect
function PrivateRoute({ children }) {
  const location = useLocation();
  return auth.currentUser
    ? children
    : <Navigate to="/" state={{ from: location }} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/mainpage" element={<MainPage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/business/:id" element={<BusinessPage />} />
      {/* Public pages */}
      <Route path="/prospores" element={<OffersPage />} />
      <Route path="/ekdiloseis" element={<EventsPage />} />
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
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
