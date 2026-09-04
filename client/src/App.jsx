import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PropertyList from "./pages/PropertyList";
import PropertyForm from "./pages/PropertyForm";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/public/Home";
import Browse from "./pages/public/Browse";
import PropertyDetail from "./pages/public/PropertyDetail";
import PublicLayout from "./components/PublicLayout";
import TourBuilder360 from "./components/TourBuilder360";




export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="browse/:category" element={<Browse />} />
        <Route path="property/:id" element={<PropertyDetail />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="properties" element={<PropertyList />} />
        <Route path="properties/new" element={<PropertyForm />} />
        <Route path="properties/tour-builder" element={<TourBuilder360 />} />

        <Route path="properties/:id/edit" element={<PropertyForm />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
