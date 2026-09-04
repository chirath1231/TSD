import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import {
  FiHome,
  FiCalendar,
  FiDollarSign,
  FiPlusCircle,
  FiArrowRight,
  FiMapPin,
} from "react-icons/fi";
import { BsBuildings } from "react-icons/bs";

const CATEGORY_LABELS = {
  short_term_rent: "Short Term Rent",
  long_term_rent: "Long Term Rent",
  sale: "Sale",
};

const TYPE_LABELS = {
  apartment: "Apartment",
  house: "House",
  commercial: "Commercial",
  land: "Land",
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/properties/stats/summary")
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">
            <BsBuildings size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats?.total || 0}</h3>
            <p>Total Properties</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">
            <FiCalendar size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats?.shortTerm || 0}</h3>
            <p>Short Term Rentals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <FiHome size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats?.longTerm || 0}</h3>
            <p>Long Term Rentals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <FiDollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>{stats?.sale || 0}</h3>
            <p>For Sale</p>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2>Recently Added</h2>
        <Link to="/admin/properties" className="btn btn-outline btn-sm">
          View All <FiArrowRight size={14} />
        </Link>
      </div>

      <div className="table-container">
        {stats?.recent?.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Property</th>
                <th>Category</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0].image_path}
                        alt=""
                        className="property-thumb"
                      />
                    ) : (
                      <div
                        className="property-thumb"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f3f4f6",
                          color: "#9ca3af",
                        }}
                      >
                        <BsBuildings />
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="property-name">
                      {p.building_name || "Unnamed Property"}
                    </div>
                    {p.location && (
                      <div className="property-location">
                        <FiMapPin size={11} /> {p.location}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {CATEGORY_LABELS[p.category]}
                    </span>
                  </td>
                  <td>{TYPE_LABELS[p.property_type]}</td>
                  <td>
                    <span
                      className={`badge ${p.status === "active" ? "badge-green" : "badge-red"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/admin/properties/${p.id}/edit`}
                      className="btn btn-outline btn-sm"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="table-empty">
            <BsBuildings size={40} />
            <p>No properties yet.</p>
            <Link
              to="/admin/properties/new"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
            >
              <FiPlusCircle size={16} /> Add First Property
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
