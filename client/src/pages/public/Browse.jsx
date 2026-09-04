import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../utils/api";
import {
  FiSliders,
  FiMapPin,
  FiGrid,
  FiList,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
} from "react-icons/fi";
import { BsBuildings, BsCameraFill } from "react-icons/bs";

const CATEGORY_TITLES = {
  short_term_rent: "Short Term Rentals",
  long_term_rent: "Long Term Rentals",
  sale: "Properties for Sale",
};

const CATEGORY_DESCRIPTIONS = {
  short_term_rent:
    "Find the perfect short-stay accommodation — holiday homes, serviced apartments, and more.",
  long_term_rent:
    "Browse monthly and yearly rental properties — apartments, houses, and commercial spaces.",
  sale: "Explore properties for sale — land, apartments, houses, and commercial buildings.",
};

const PROPERTY_TYPES = {
  short_term_rent: ["apartment", "house"],
  long_term_rent: ["apartment", "house", "commercial"],
  sale: ["apartment", "house", "land", "commercial"],
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function PropertyCard({ prop, category, viewMode }) {
  const getPrice = () => {
    if (category === "sale")
      return "Rs. " + Number(prop.sale_price || 0).toLocaleString();
    if (category === "short_term_rent")
      return (
        "Rs. " + Number(prop.per_night_rate || 0).toLocaleString() + " / night"
      );
    if (category === "long_term_rent")
      return (
        "Rs. " + Number(prop.rent_per_month || 0).toLocaleString() + " / month"
      );
    return "—";
  };

  if (viewMode === "list") {
    return (
      <Link to={`/property/${prop.id}`} className="property-card-link">
        <motion.div
          className="property-list-item"
          variants={fadeUp}
          layout
          whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
        >
          <div className="property-list-image">
            {prop.images?.[0] ? (
              <img
                src={prop.images[0].image_path}
                alt={prop.building_name}
                loading="lazy"
              />
            ) : (
              <div className="property-card-placeholder">
                <BsBuildings size={36} />
              </div>
            )}
            {prop.virtual_tours?.length > 0 && (
              <span className="property-card-tour-badge">
                <BsCameraFill size={12} /> 360°
              </span>
            )}
          </div>
          <div className="property-list-body">
            <h3>{prop.building_name || "Unnamed Property"}</h3>
            <p className="property-card-location">
              <FiMapPin size={13} /> {prop.location || "Location TBD"}
            </p>
            <div className="property-card-features">
              {prop.property_type !== "land" && prop.bedrooms && (
                <span>🛏️ {prop.bedrooms} Beds</span>
              )}
              {prop.property_type !== "land" && prop.bathrooms && (
                <span>🚿 {prop.bathrooms} Baths</span>
              )}
              {prop.floor_area && (
                <span>📏 {Number(prop.floor_area).toLocaleString()} sqft</span>
              )}
            </div>
            <div className="property-list-footer">
              <span className="property-card-price">{getPrice()}</span>
              <span className="property-card-view">
                View Details <FiArrowRight size={14} />
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/property/${prop.id}`} className="property-card-link">
      <motion.div
        className="property-card"
        variants={fadeUp}
        layout
        whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,.12)" }}
      >
        <div className="property-card-image">
          {prop.images?.[0] ? (
            <img
              src={prop.images[0].image_path}
              alt={prop.building_name}
              loading="lazy"
            />
          ) : (
            <div className="property-card-placeholder">
              <BsBuildings size={48} />
            </div>
          )}
          {prop.virtual_tours?.length > 0 && (
            <span className="property-card-tour-badge">
              <BsCameraFill size={12} /> 360°
            </span>
          )}
        </div>
        <div className="property-card-body">
          <h3 className="property-card-title">
            {prop.building_name || "Unnamed Property"}
          </h3>
          <p className="property-card-location">
            <FiMapPin size={13} /> {prop.location || "Location TBD"}
          </p>
          <div className="property-card-features">
            {prop.property_type !== "land" && prop.bedrooms && (
              <span>🛏️ {prop.bedrooms} Beds</span>
            )}
            {prop.property_type !== "land" && prop.bathrooms && (
              <span>🚿 {prop.bathrooms} Baths</span>
            )}
            {prop.floor_area && (
              <span>📏 {Number(prop.floor_area).toLocaleString()} sqft</span>
            )}
          </div>
          <div className="property-card-footer">
            <span className="property-card-price">{getPrice()}</span>
            <span className="property-card-view">
              View <FiArrowRight size={14} />
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function Browse() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
  });

  const [propertyType, setPropertyType] = useState(
    searchParams.get("type") || "",
  );
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    setLoading(true);
    const params = {
      category,
      page: searchParams.get("page") || 1,
      limit: 12,
    };
    if (propertyType) params.property_type = propertyType;
    if (location) params.location = location;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;

    api
      .get("/public/properties", { params })
      .then(({ data }) => {
        setProperties(data.properties);
        setPagination(data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, searchParams, propertyType, location, minPrice, maxPrice]);

  // Reset filters when category changes
  useEffect(() => {
    setPropertyType("");
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
  }, [category]);

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (propertyType) params.set("type", propertyType);
    if (location) params.set("location", location);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("page", "1");
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setPropertyType("");
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setSearchParams({ page: "1" });
    setShowFilters(false);
  };

  const hasActiveFilters = propertyType || location || minPrice || maxPrice;

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage);
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="browse-page">
      {/* Page Header */}
      <div className="browse-header">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>{CATEGORY_TITLES[category] || "Properties"}</h1>
            <p>{CATEGORY_DESCRIPTIONS[category] || ""}</p>
          </motion.div>
        </div>
      </div>

      <div className="section-container">
        <div className="browse-content">
          {/* Toolbar */}
          <motion.div
            className="browse-toolbar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="browse-toolbar-left">
              <span className="browse-count">
                {pagination.total}{" "}
                {pagination.total === 1 ? "property" : "properties"} found
              </span>
              {hasActiveFilters && (
                <button className="browse-clear-btn" onClick={clearFilters}>
                  <FiX size={14} /> Clear Filters
                </button>
              )}
            </div>
            <div className="browse-toolbar-right">
              <button
                className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <FiGrid size={18} />
              </button>
              <button
                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <FiList size={18} />
              </button>
              <button
                className="browse-filter-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiSliders size={16} /> Filters
                {hasActiveFilters && <span className="filter-dot" />}
              </button>
            </div>
          </motion.div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                className="filter-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="filter-panel-inner">
                  <div className="filter-group">
                    <label>Property Type</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                    >
                      <option value="">All Types</option>
                      {(PROPERTY_TYPES[category] || []).map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Colombo 07"
                    />
                  </div>

                  <div className="filter-group">
                    <label>Min Price (Rs.)</label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="filter-group">
                    <label>Max Price (Rs.)</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Any"
                    />
                  </div>

                  <div className="filter-actions">
                    <button className="filter-apply-btn" onClick={handleFilter}>
                      Apply Filters
                    </button>
                    <button className="filter-clear-btn" onClick={clearFilters}>
                      Clear
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Properties */}
          {loading ? (
            <div className="loading-spinner" style={{ minHeight: 400 }}>
              <div className="spinner" />
            </div>
          ) : properties.length > 0 ? (
            <>
              <motion.div
                className={viewMode === "grid" ? "browse-grid" : "browse-list"}
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.06 } },
                }}
              >
                {properties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    prop={prop}
                    category={category}
                    viewMode={viewMode}
                  />
                ))}
              </motion.div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="browse-pagination">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="page-btn"
                  >
                    <FiChevronLeft size={18} />
                  </button>

                  {[...Array(Math.min(5, pagination.totalPages))].map(
                    (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i;
                      if (pageNum > pagination.totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`page-btn ${pageNum === pagination.page ? "active" : ""}`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}

                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="page-btn"
                  >
                    <FiChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <motion.div
              className="browse-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <BsBuildings size={56} />
              <h3>No Properties Found</h3>
              <p>
                No properties match your current filters. Try adjusting your
                search criteria.
              </p>
              {hasActiveFilters && (
                <button className="filter-apply-btn" onClick={clearFilters}>
                  Clear All Filters
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
