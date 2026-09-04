import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import CountUp from "react-countup";
import { useInView as useCountInView } from "react-intersection-observer";
import api from "../../utils/api";
import {
  FiArrowRight,
  FiSearch,
  FiMapPin,
  FiHome,
  FiShield,
  FiClock,
  FiPhone,
  FiStar,
} from "react-icons/fi";
import {
  BsBuildings,
  BsCameraFill,
  BsPeopleFill,
  BsCheckCircleFill,
  BsHouseDoorFill,
  BsGeoAltFill,
} from "react-icons/bs";

import "swiper/css";
import "swiper/css/pagination";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

function AnimatedSection({ children, className }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function PropertyCard({ prop }) {
  const getPrice = () => {
    if (prop.category === "sale")
      return "Rs. " + Number(prop.sale_price || 0).toLocaleString();
    if (prop.category === "short_term_rent")
      return (
        "Rs. " + Number(prop.per_night_rate || 0).toLocaleString() + " /night"
      );
    return "Rs. " + Number(prop.rent_per_month || 0).toLocaleString() + " /mo";
  };

  const categoryLabel =
    prop.category === "short_term_rent"
      ? "Short Term"
      : prop.category === "long_term_rent"
        ? "Long Term"
        : "For Sale";

  const categoryColor =
    prop.category === "short_term_rent"
      ? "#f59e0b"
      : prop.category === "long_term_rent"
        ? "#3b82f6"
        : "#10b981";

  return (
    <Link to={`/property/${prop.id}`} className="property-card-link">
      <motion.div className="property-card" variants={fadeUp}>
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
          <span
            className="property-card-badge"
            style={{ background: categoryColor }}
          >
            {categoryLabel}
          </span>
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

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsRef, statsInView] = useCountInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  useEffect(() => {
    api
      .get("/public/featured")
      .then(({ data }) => setFeatured(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    {
      key: "short_term_rent",
      title: "Short Term Rentals",
      desc: "Holiday homes, Airbnb-style stays, and furnished apartments for short visits.",
      icon: <FiClock size={28} />,
      color: "#f59e0b",
    },
    {
      key: "long_term_rent",
      title: "Long Term Rentals",
      desc: "Apartments, houses, and commercial spaces for monthly or yearly leases.",
      icon: <FiHome size={28} />,
      color: "#3b82f6",
    },
    {
      key: "sale",
      title: "Properties for Sale",
      desc: "Land, houses, apartments, and commercial properties available for purchase.",
      icon: <BsHouseDoorFill size={28} />,
      color: "#10b981",
    },
  ];

  const whyUs = [
    {
      icon: <BsHouseDoorFill size={28} />,
      title: "Wide Selection",
      desc: "Hundreds of verified properties across all categories and prime locations in Sri Lanka.",
    },
    {
      icon: <BsCameraFill size={28} />,
      title: "360° Virtual Tours",
      desc: "Experience properties remotely with immersive Insta360 virtual walkthroughs.",
    },
    {
      icon: <BsCheckCircleFill size={28} />,
      title: "Verified Listings",
      desc: "Every property is inspected and verified by our team before listing.",
    },
    {
      icon: <FiShield size={28} />,
      title: "Secure Process",
      desc: "Transparent agreements, legal compliance, and secure transactions guaranteed.",
    },
    {
      icon: <FiClock size={28} />,
      title: "Quick Response",
      desc: "Our team responds to all inquiries within 24 hours with detailed information.",
    },
    {
      icon: <FiStar size={28} />,
      title: "Expert Support",
      desc: "Dedicated real estate advisors to guide you through every step of the process.",
    },
  ];

  return (
    <div className="public-home">
      {/* ========== HERO ========== */}
      <section className="hero-section">
        <div className="hero-overlay" />
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="hero-badge">
              <BsGeoAltFill /> Sri Lanka's Trusted Real Estate Partner
            </span>
          </motion.div>
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            Find Your <span className="hero-highlight">Perfect Property</span>
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Discover premium apartments, houses, and commercial spaces for rent
            or sale across Sri Lanka. Your dream property is just a click away.
          </motion.p>
          <motion.div
            className="hero-cta-group"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            <Link
              to="/browse/short_term_rent"
              className="hero-btn hero-btn-primary"
            >
              <FiSearch size={18} /> Explore Properties
            </Link>
            <a href="tel:+94112345678" className="hero-btn hero-btn-outline">
              <FiPhone size={18} /> Contact Us
            </a>
          </motion.div>
        </div>
        <div className="hero-scroll-indicator">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          >
            ↓
          </motion.div>
        </div>
      </section>

      {/* ========== CATEGORY CARDS ========== */}
      <AnimatedSection className="categories-section">
        <div className="section-container">
          <motion.div className="section-header-center" variants={fadeUp}>
            <span className="section-tag">What We Offer</span>
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">
              Choose from our three main property categories
            </p>
          </motion.div>
          <div className="categories-grid">
            {categories.map((cat, i) => (
              <motion.div key={cat.key} variants={fadeUp} custom={i}>
                <Link
                  to={`/browse/${cat.key}`}
                  className="category-card"
                  style={{ "--cat-color": cat.color }}
                >
                  <div className="category-card-icon">{cat.icon}</div>
                  <h3>{cat.title}</h3>
                  <p>{cat.desc}</p>
                  <span className="category-card-link">
                    Browse Now <FiArrowRight size={16} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ========== FEATURED PROPERTIES ========== */}
      <AnimatedSection className="featured-section">
        <div className="section-container">
          <motion.div className="section-header-center" variants={fadeUp}>
            <span className="section-tag">Handpicked</span>
            <h2 className="section-title">Featured Properties</h2>
            <p className="section-subtitle">
              Explore some of our best available listings
            </p>
          </motion.div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
            </div>
          ) : featured.length > 0 ? (
            <>
              <div className="featured-grid desktop-only">
                {featured.map((prop) => (
                  <PropertyCard key={prop.id} prop={prop} />
                ))}
              </div>
              <div className="mobile-only">
                <Swiper
                  modules={[Autoplay, Pagination]}
                  spaceBetween={16}
                  slidesPerView={1.15}
                  centeredSlides
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 4000, disableOnInteraction: false }}
                  style={{ paddingBottom: 48 }}
                >
                  {featured.map((prop) => (
                    <SwiperSlide key={prop.id}>
                      <PropertyCard prop={prop} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              <motion.div
                variants={fadeUp}
                style={{ textAlign: "center", marginTop: 32 }}
              >
                <Link to="/browse/short_term_rent" className="btn-view-all">
                  View All Properties <FiArrowRight size={16} />
                </Link>
              </motion.div>
            </>
          ) : (
            <div className="empty-state">
              <BsBuildings size={48} />
              <p>No properties listed yet. Check back soon!</p>
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* ========== STATS ========== */}
      <section className="stats-section" ref={statsRef}>
        <div className="section-container">
          <div className="stats-grid-public">
            {[
              {
                value: 200,
                suffix: "+",
                label: "Properties Listed",
                icon: <BsHouseDoorFill size={24} />,
              },
              {
                value: 150,
                suffix: "+",
                label: "Happy Clients",
                icon: <BsPeopleFill size={24} />,
              },
              {
                value: 15,
                suffix: "+",
                label: "Locations Covered",
                icon: <BsGeoAltFill size={24} />,
              },
              {
                value: 5,
                suffix: "+",
                label: "Years Experience",
                icon: <FiStar size={24} />,
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="stat-item"
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="stat-item-icon">{stat.icon}</div>
                <h3>
                  {statsInView ? (
                    <CountUp end={stat.value} duration={2.5} separator="," />
                  ) : (
                    0
                  )}
                  {stat.suffix}
                </h3>
                <p>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHY CHOOSE US ========== */}
      <AnimatedSection className="why-section">
        <div className="section-container">
          <motion.div className="section-header-center" variants={fadeUp}>
            <span className="section-tag">Why TSD</span>
            <h2 className="section-title">
              Why Choose TSD Property Solutions?
            </h2>
            <p className="section-subtitle">
              We go above and beyond to deliver exceptional real estate services
            </p>
          </motion.div>
          <div className="why-grid">
            {whyUs.map((item, i) => (
              <motion.div
                key={i}
                className="why-card"
                variants={fadeUp}
                custom={i}
              >
                <div className="why-card-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ========== CTA SECTION ========== */}
      <section className="cta-section">
        <div className="section-container">
          <motion.div
            className="cta-content"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Ready to Find Your Dream Property?</h2>
            <p>
              Browse our complete catalog or contact our experts for a free
              personalized consultation.
            </p>
            <div className="cta-buttons">
              <Link
                to="/browse/short_term_rent"
                className="hero-btn hero-btn-primary"
              >
                Start Browsing <FiArrowRight size={18} />
              </Link>
              <a
                href="tel:+94112345678"
                className="hero-btn hero-btn-outline-dark"
              >
                <FiPhone size={18} /> Call Now
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
