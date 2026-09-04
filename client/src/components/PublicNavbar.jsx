import { Link, useLocation } from "react-router-dom";
import { BsBuildings } from "react-icons/bs";
import { FiMenu, FiX, FiPhone, FiMail, FiChevronDown } from "react-icons/fi";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/browse/short_term_rent", label: "Short Term" },
  { to: "/browse/long_term_rent", label: "Long Term" },
  { to: "/browse/sale", label: "For Sale" },
];

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-inner section-container">
          <div className="top-bar-left">
            <a href="tel:+94112345678">
              <FiPhone size={12} /> +94 11 234 5678
            </a>
            <a href="mailto:info@tsdproperty.com">
              <FiMail size={12} /> info@tsdproperty.com
            </a>
          </div>
          <div className="top-bar-right">
            <Link to="/admin/login">Admin Portal</Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className={`public-navbar ${scrolled ? "scrolled" : ""}`}>
        <nav className="public-navbar-inner section-container">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">
              <BsBuildings size={22} />
            </div>
            <div className="navbar-logo-text">
              <span className="navbar-logo-name">TSD Property</span>
              <span className="navbar-logo-sub">SOLUTIONS</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="navbar-links">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`navbar-link ${isActive(link.to) ? "active" : ""}`}
              >
                {link.label}
                {isActive(link.to) && (
                  <motion.div
                    className="navbar-link-indicator"
                    layoutId="navIndicator"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Contact CTA */}
          <a href="tel:+94112345678" className="navbar-cta">
            <FiPhone size={15} /> Call Now
          </a>

          {/* Mobile Toggle */}
          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="mobile-menu-header">
                <Link
                  to="/"
                  className="navbar-logo"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="navbar-logo-icon">
                    <BsBuildings size={20} />
                  </div>
                  <div className="navbar-logo-text">
                    <span className="navbar-logo-name">TSD Property</span>
                    <span className="navbar-logo-sub">SOLUTIONS</span>
                  </div>
                </Link>
                <button
                  className="mobile-menu-close"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FiX size={22} />
                </button>
              </div>
              <div className="mobile-menu-links">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      to={link.to}
                      className={`mobile-menu-link ${isActive(link.to) ? "active" : ""}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mobile-menu-footer">
                <a href="tel:+94112345678" className="mobile-menu-cta">
                  <FiPhone size={18} /> +94 11 234 5678
                </a>
                <a
                  href="mailto:info@tsdproperty.com"
                  className="mobile-menu-cta secondary"
                >
                  <FiMail size={18} /> info@tsdproperty.com
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
