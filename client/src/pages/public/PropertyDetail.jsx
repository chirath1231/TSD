import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, Zoom, Pagination } from "swiper/modules";
import api from "../../utils/api";
import { toast } from "react-toastify";
import {
  FiChevronLeft,
  FiMapPin,
  FiPhone,
  FiMail,
  FiSend,
  FiCheck,
  FiMaximize2,
  FiX,
  FiShare2,
  FiCopy,
  FiExternalLink,
} from "react-icons/fi";
import { BsBuildings, BsCameraFill } from "react-icons/bs";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/zoom";
import "swiper/css/pagination";

const CATEGORY_LABELS = {
  short_term_rent: "Short Term Rental",
  long_term_rent: "Long Term Rental",
  sale: "For Sale",
};

const TYPE_LABELS = {
  apartment: "Apartment",
  house: "House",
  commercial: "Commercial Space",
  land: "Land",
};

const CATEGORY_COLORS = {
  short_term_rent: { bg: "#fef3c7", text: "#92400e" },
  long_term_rent: { bg: "#dbeafe", text: "#1e40af" },
  sale: { bg: "#d1fae5", text: "#065f46" },
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [selectedTourIndex, setSelectedTourIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    full_name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    api
      .get(`/public/properties/${id}`)
      .then(({ data }) => setProperty(data))
      .catch(() => {
        toast.error("Property not found");
        navigate("/");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!inquiryData.full_name || !inquiryData.email || !inquiryData.message) {
      toast.error("Please fill in name, email, and message");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/public/inquiries", {
        property_id: property.id,
        ...inquiryData,
      });
      setSubmitted(true);
      setTimeout(() => {
        setShowInquiryForm(false);
        setSubmitted(false);
        setInquiryData({
          full_name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      }, 2000);
      toast.success("Inquiry submitted! We'll contact you soon.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit inquiry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.building_name,
          text: `Check out this property: ${property.building_name}`,
          url,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: "80vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!property) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>Property not found</div>
    );
  }

  const hasImages = property.images?.length > 0;
  const hasTours = property.virtual_tours?.length > 0;
  const currentTour = hasTours
    ? property.virtual_tours[selectedTourIndex]
    : null;
  // Tours built in-house are served from our own /api/tours/view/ endpoint and
  // can be safely embedded. External links (e.g. pasted Insta360 share URLs)
  // are served with a `frame-ancestors` CSP that blocks embedding on any other
  // site, so those must be opened in a new tab instead of iframed.
  const isEmbeddableTour = (url) => {
    if (!url) return false;
    try {
      return new URL(url, window.location.origin).origin === window.location.origin;
    } catch {
      return false;
    }
  };
  const catColors = CATEGORY_COLORS[property.category] || {};

  const getPrice = () => {
    if (property.category === "sale")
      return {
        main: "Rs. " + Number(property.sale_price || 0).toLocaleString(),
        label: "Sale Price",
      };
    if (property.category === "short_term_rent")
      return {
        main: "Rs. " + Number(property.per_night_rate || 0).toLocaleString(),
        label: "Per Night",
      };
    return {
      main: "Rs. " + Number(property.rent_per_month || 0).toLocaleString(),
      label: "Per Month",
    };
  };

  const priceInfo = getPrice();

  const detailItems = [
    {
      label: "Type",
      value: TYPE_LABELS[property.property_type],
      show: true,
    },
    {
      label: "Bedrooms",
      value: property.bedrooms,
      show: property.property_type !== "land" && property.bedrooms,
    },
    {
      label: "Bathrooms",
      value: property.bathrooms,
      show: property.property_type !== "land" && property.bathrooms,
    },
    {
      label: "Floor Area",
      value: property.floor_area
        ? Number(property.floor_area).toLocaleString() + " sqft"
        : null,
      show: !!property.floor_area,
    },
    {
      label: "Max Occupancy",
      value: property.max_occupancy
        ? property.max_occupancy +
          (property.max_occupancy === 1 ? " person" : " people")
        : null,
      show: property.category === "short_term_rent" && property.max_occupancy,
    },
    {
      label: "Minimum Stay",
      value: property.min_stay
        ? property.min_stay + (property.min_stay === 1 ? " night" : " nights")
        : null,
      show: property.category === "short_term_rent" && property.min_stay,
    },
    {
      label: "Furnishing",
      value: property.furnished,
      show: !!property.furnished,
    },
    {
      label: "Security Deposit",
      value: property.security_deposit
        ? "Rs. " + Number(property.security_deposit).toLocaleString()
        : null,
      show: !!property.security_deposit,
    },
    {
      label: "Land Size",
      value: property.land_size
        ? Number(property.land_size).toLocaleString() + " perches"
        : null,
      show: !!property.land_size,
    },
  ].filter((item) => item.show && item.value);

  return (
    <div className="detail-page">
      <div className="section-container">
        {/* Breadcrumb / Back */}
        <motion.div
          className="detail-breadcrumb"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button onClick={() => navigate(-1)} className="detail-back-btn">
            <FiChevronLeft size={18} /> Back to listings
          </button>
          <button onClick={handleShare} className="detail-share-btn">
            <FiShare2 size={16} /> Share
          </button>
        </motion.div>

        <div className="detail-layout">
          {/* Main Content */}
          <motion.div
            className="detail-main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="detail-header">
              <span
                className="detail-category-badge"
                style={{ background: catColors.bg, color: catColors.text }}
              >
                {CATEGORY_LABELS[property.category]}
              </span>
              <h1>{property.building_name || "Property"}</h1>
              <p className="detail-location">
                <FiMapPin size={16} /> {property.location || "Location TBD"}
              </p>
            </div>

            {/* Image Gallery */}
            {hasImages ? (
              <div className="detail-gallery">
                <Swiper
                  modules={[Navigation, Thumbs, Zoom, Pagination]}
                  thumbs={{
                    swiper:
                      thumbsSwiper && !thumbsSwiper.destroyed
                        ? thumbsSwiper
                        : null,
                  }}
                  navigation
                  zoom
                  pagination={{ type: "fraction" }}
                  spaceBetween={0}
                  slidesPerView={1}
                  className="detail-gallery-main"
                >
                  {property.images.map((img, i) => (
                    <SwiperSlide key={i}>
                      <div className="swiper-zoom-container">
                        <img
                          src={img.image_path}
                          alt={`${property.building_name} - Image ${i + 1}`}
                          loading="lazy"
                        />
                      </div>
                      <button
                        className="gallery-fullscreen-btn"
                        onClick={() => {
                          setLightboxIndex(i);
                          setShowLightbox(true);
                        }}
                      >
                        <FiMaximize2 size={18} />
                      </button>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {property.images.length > 1 && (
                  <Swiper
                    modules={[Thumbs]}
                    onSwiper={setThumbsSwiper}
                    slidesPerView={Math.min(6, property.images.length)}
                    spaceBetween={8}
                    watchSlidesProgress
                    className="detail-gallery-thumbs"
                  >
                    {property.images.map((img, i) => (
                      <SwiperSlide key={i}>
                        <img src={img.image_path} alt="" loading="lazy" />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}
              </div>
            ) : (
              <div className="detail-no-images">
                <BsBuildings size={64} />
                <p>No images available</p>
              </div>
            )}

            {/* 360° Virtual Tours */}
            {hasTours && (
              <div className="detail-section">
                <h2 className="detail-section-title">
                  <BsCameraFill size={22} /> 360° Virtual Tours
                </h2>
                <div className="detail-tour-viewer">
                  {isEmbeddableTour(currentTour.tour_url) ? (
                    <>
                      <iframe
                        src={currentTour.tour_url}
                        title={`360° Tour - ${currentTour.room_name}`}
                        allowFullScreen
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                        style={{
                          width: "100%",
                          height: "420px",
                          border: "none",
                          borderRadius: "8px",
                          background: "#000",
                        }}
                        onLoad={(e) => {
                          e.currentTarget.nextElementSibling?.style.setProperty(
                            "display",
                            "none",
                            "important",
                          );
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "420px",
                          background: "#f3f4f8",
                          borderRadius: "8px",
                          flexDirection: "column",
                          gap: "16px",
                          color: "#6b7280",
                        }}
                      >
                        <BsCameraFill size={48} />
                        <p>
                          360° tour currently unavailable. Please try again later.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "420px",
                        background: "#f3f4f8",
                        borderRadius: "8px",
                        flexDirection: "column",
                        gap: "16px",
                        color: "#6b7280",
                      }}
                    >
                      <BsCameraFill size={48} />
                      <p>
                        This 360° tour is hosted externally and can't be
                        embedded here.
                      </p>
                      <a
                        href={currentTour.tour_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="detail-tour-external-link"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 20px",
                          borderRadius: "8px",
                          background: "#1b4332",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "14px",
                          textDecoration: "none",
                        }}
                      >
                        Open 360° Tour <FiExternalLink size={16} />
                      </a>
                    </div>
                  )}
                </div>
                {property.virtual_tours.length > 1 && (
                  <div className="detail-tour-tabs">
                    {property.virtual_tours.map((tour, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTourIndex(i)}
                        className={`tour-tab ${i === selectedTourIndex ? "active" : ""}`}
                      >
                        {tour.room_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Property Details */}
            <div className="detail-section">
              <h2 className="detail-section-title">Property Details</h2>
              <div className="detail-grid">
                {detailItems.map((item, i) => (
                  <div key={i} className="detail-grid-item">
                    <span className="detail-grid-label">{item.label}</span>
                    <span className="detail-grid-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="detail-section">
                <h2 className="detail-section-title">Description</h2>
                <p className="detail-description">{property.description}</p>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="detail-sidebar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {/* Price Card */}
            <div className="detail-price-card">
              <p className="detail-price-label">{priceInfo.label}</p>
              <h2 className="detail-price-value">{priceInfo.main}</h2>
              {property.category === "short_term_rent" &&
                property.rent_per_month && (
                  <p className="detail-price-sub">
                    Monthly: Rs.{" "}
                    {Number(property.rent_per_month).toLocaleString()}
                  </p>
                )}
              <button
                className="detail-inquiry-btn"
                onClick={() => setShowInquiryForm(true)}
              >
                <FiSend size={16} /> Send Inquiry
              </button>
            </div>

            {/* Contact Card */}
            <div className="detail-contact-card">
              <h3>Contact TSD Property Solutions</h3>
              <a href="tel:+94112345678" className="detail-contact-item">
                <FiPhone size={18} />
                <span>+94 11 234 5678</span>
              </a>
              <a
                href="mailto:info@tsdproperty.com"
                className="detail-contact-item"
              >
                <FiMail size={18} />
                <span>info@tsdproperty.com</span>
              </a>
            </div>

            {/* Quick Features */}
            {detailItems.length > 0 && (
              <div className="detail-quick-features">
                <h3>Quick Overview</h3>
                {detailItems.slice(0, 4).map((item, i) => (
                  <div key={i} className="quick-feature-row">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && hasImages && (
          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLightbox(false)}
          >
            <button
              className="lightbox-close"
              onClick={() => setShowLightbox(false)}
            >
              <FiX size={24} />
            </button>
            <motion.div
              className="lightbox-content"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ type: "fraction" }}
                initialSlide={lightboxIndex}
                spaceBetween={0}
                slidesPerView={1}
                className="lightbox-swiper"
              >
                {property.images.map((img, i) => (
                  <SwiperSlide key={i}>
                    <img src={img.image_path} alt="" />
                  </SwiperSlide>
                ))}
              </Swiper>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inquiry Modal */}
      <AnimatePresence>
        {showInquiryForm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInquiryForm(false)}
          >
            <motion.div
              className="inquiry-modal"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="inquiry-modal-close"
                onClick={() => setShowInquiryForm(false)}
              >
                <FiX size={20} />
              </button>

              {submitted ? (
                <div className="inquiry-success">
                  <div className="inquiry-success-icon">
                    <FiCheck size={32} />
                  </div>
                  <h3>Inquiry Submitted!</h3>
                  <p>We'll contact you soon with more information.</p>
                </div>
              ) : (
                <>
                  <h3 className="inquiry-modal-title">Send Inquiry</h3>
                  <p className="inquiry-modal-subtitle">
                    Interested in <strong>{property.building_name}</strong>?
                    Fill out the form below.
                  </p>
                  <form onSubmit={handleInquirySubmit}>
                    <div className="inquiry-form-grid">
                      <div className="inquiry-field">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          value={inquiryData.full_name}
                          onChange={(e) =>
                            setInquiryData({
                              ...inquiryData,
                              full_name: e.target.value,
                            })
                          }
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div className="inquiry-field">
                        <label>Email *</label>
                        <input
                          type="email"
                          value={inquiryData.email}
                          onChange={(e) =>
                            setInquiryData({
                              ...inquiryData,
                              email: e.target.value,
                            })
                          }
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                      <div className="inquiry-field">
                        <label>Phone</label>
                        <input
                          type="tel"
                          value={inquiryData.phone}
                          onChange={(e) =>
                            setInquiryData({
                              ...inquiryData,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Your phone number"
                        />
                      </div>
                      <div className="inquiry-field">
                        <label>Subject</label>
                        <input
                          type="text"
                          value={inquiryData.subject}
                          onChange={(e) =>
                            setInquiryData({
                              ...inquiryData,
                              subject: e.target.value,
                            })
                          }
                          placeholder="e.g. Interested in booking"
                        />
                      </div>
                    </div>
                    <div className="inquiry-field" style={{ marginTop: 16 }}>
                      <label>Message *</label>
                      <textarea
                        value={inquiryData.message}
                        onChange={(e) =>
                          setInquiryData({
                            ...inquiryData,
                            message: e.target.value,
                          })
                        }
                        placeholder="Tell us more about your inquiry..."
                        required
                        rows={4}
                      />
                    </div>
                    <div className="inquiry-form-actions">
                      <button
                        type="button"
                        className="inquiry-cancel-btn"
                        onClick={() => setShowInquiryForm(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inquiry-submit-btn"
                        disabled={submitting}
                      >
                        {submitting ? "Sending..." : "Send Inquiry"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
