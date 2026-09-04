import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiHome,
  FiList,
  FiPlusCircle,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { BsBuildings } from "react-icons/bs";

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = () => {
    const path = location.pathname;
    if (path.includes("/properties/new")) return "Add New Property";
    if (path.includes("/properties") && path.includes("/edit"))
      return "Edit Property";
    if (path.includes("/properties")) return "Properties";
    return "Dashboard";
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/admin/login";
  };

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.3)",
            zIndex: 99,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <BsBuildings size={22} />
          </div>
          <div className="sidebar-brand-text">
            <h2>TSD Properties</h2>
            <span>Admin Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          <NavLink to="/admin/dashboard" onClick={() => setSidebarOpen(false)}>
            <FiHome size={18} /> Dashboard
          </NavLink>
          <NavLink
            to="/admin/properties"
            end
            onClick={() => setSidebarOpen(false)}
          >
            <FiList size={18} /> Properties
          </NavLink>
          <NavLink
            to="/admin/properties/new"
            onClick={() => setSidebarOpen(false)}
          >
            <FiPlusCircle size={18} /> Add Property
          </NavLink>

          <div className="sidebar-spacer" />

          <div className="sidebar-section-label">Account</div>
          <button onClick={handleLogout}>
            <FiLogOut size={18} /> Logout
          </button>
        </nav>
      </aside>

      <div className="main-content">
        <header className="navbar">
          <div className="navbar-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
            <h1>{pageTitle()}</h1>
          </div>
          <div className="navbar-right">
            <div className="navbar-user">
              <span>{user?.username}</span>
              <div className="navbar-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
