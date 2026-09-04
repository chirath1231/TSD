import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-toastify";
import {
  FiEdit2,
  FiTrash2,
  FiPlusCircle,
  FiMapPin,
  FiSearch,
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

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;
      const { data } = await api.get("/properties", { params });
      setProperties(data);
    } catch (err) {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchProperties, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await api.delete(`/properties/${deleteModal.id}`);
      toast.success("Property deleted");
      setDeleteModal(null);
      fetchProperties();
    } catch (err) {
      toast.error("Failed to delete property");
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (val) => {
    if (!val) return "—";
    return "Rs. " + Number(val).toLocaleString();
  };

  const getPrice = (p) => {
    if (p.category === "sale") return formatPrice(p.sale_price);
    if (p.category === "short_term_rent")
      return formatPrice(p.per_night_rate) + "/night";
    if (p.category === "long_term_rent")
      return formatPrice(p.rent_per_month) + "/mo";
    return "—";
  };

  return (
    <div>
      <div className="section-header">
        <h2>{properties.length} Properties</h2>
        <Link to="/admin/properties/new" className="btn btn-primary">
          <FiPlusCircle size={16} /> Add Property
        </Link>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            {["", "short_term_rent", "long_term_rent", "sale"].map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${categoryFilter === cat ? "active" : ""}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat ? CATEGORY_LABELS[cat] : "All"}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="Search properties…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner" />
          </div>
        ) : properties.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Property</th>
                <th>Category</th>
                <th>Type</th>
                <th>Beds / Baths</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
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
                      {p.building_name || "Unnamed"}
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
                    {p.property_type !== "land"
                      ? `${p.bedrooms || "—"} / ${p.bathrooms || "—"}`
                      : "—"}
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--primary)" }}>
                    {getPrice(p)}
                  </td>
                  <td>
                    <span
                      className={`badge ${p.status === "active" ? "badge-green" : "badge-red"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link to={`/admin/properties/${p.id}/edit`}>
                        <button title="Edit">
                          <FiEdit2 size={14} />
                        </button>
                      </Link>
                      <button
                        className="delete"
                        title="Delete"
                        onClick={() => setDeleteModal(p)}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="table-empty">
            <BsBuildings size={40} />
            <p>No properties found.</p>
            <Link
              to="/admin/properties/new"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
            >
              <FiPlusCircle size={16} /> Add Property
            </Link>
          </div>
        )}
      </div>

      {deleteModal && (
        <div
          className="modal-overlay"
          onClick={() => !deleting && setDeleteModal(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Property</h3>
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteModal.building_name || "this property"}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
