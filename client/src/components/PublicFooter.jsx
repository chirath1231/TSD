import { Link } from "react-router-dom";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiInstagram,
  FiFacebook,
  FiArrowRight,
} from "react-icons/fi";
import { BsBuildings } from "react-icons/bs";
import { CONTACTS } from "../utils/contacts";

// Edit this text to describe what TSD Property Solutions does
const WHAT_WE_DO = [
  {
    title: "Short Term & Holiday Lets",
    text: "Fully furnished holiday homes and apartments for short stays, with hassle-free booking and guest support.",
  },
  {
    title: "Long Term Rentals",
    text: "Quality homes, apartments and commercial spaces for long term tenants, matched to your needs and budget.",
  },
  {
    title: "Property Sales",
    text: "Helping you buy or sell houses, apartments and land across Sri Lanka with honest advice from start to finish.",
  },
  {
    title: "Property Management",
    text: "We look after your property for you — tenants, maintenance and rent collection — so you can relax.",
  },
];

export default function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="section-container">
        {/* What We Do */}
        <div className="footer-what-we-do">
          <h4>What We Do</h4>
          <div className="footer-what-we-do-grid">
            {WHAT_WE_DO.map((item) => (
              <div key={item.title} className="footer-what-we-do-item">
                <h5>{item.title}</h5>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <div className="footer-logo-icon">
                <BsBuildings size={22} />
              </div>
              <div>
                <span className="footer-logo-name">TSD Property</span>
                <span className="footer-logo-sub">SOLUTIONS</span>
              </div>
            </Link>
            <p className="footer-about">
              Your trusted partner in Sri Lanka's real estate market. We
              specialize in buying, selling, renting, and managing properties
              with integrity and expertise.
            </p>
            <div className="footer-social">
              <a
                href="https://instagram.com/tsd_properties_international"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <FiInstagram size={18} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="Facebook"
              >
                <FiFacebook size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/browse/short_term_rent">Short Term Rentals</Link>
              </li>
              <li>
                <Link to="/browse/long_term_rent">Long Term Rentals</Link>
              </li>
              <li>
                <Link to="/browse/sale">Properties for Sale</Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li>
                <a href="#">Property Management</a>
              </li>
              <li>
                <a href="#">Virtual Tours</a>
              </li>
              <li>
                <a href="#">Real Estate Consulting</a>
              </li>
              <li>
                <a href="#">Investment Advisory</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-section" id="contact">
            <h4>Get In Touch</h4>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <FiMapPin size={16} />
                <span>
                  21/7 Rev. Dhammarthana, Mawatha
                  <br />
                  Jayavardhapura, Sri Lanka 10100
                </span>
              </div>
              {CONTACTS.map((c) => (
                <div className="footer-contact-item" key={c.tel}>
                  <FiPhone size={16} />
                  <span>
                    {c.label}
                    <br />
                    <a href={`tel:${c.tel}`}>{c.display}</a>
                  </span>
                </div>
              ))}
              <div className="footer-contact-item">
                <FiMail size={16} />
                <a href="mailto:info@tsdproperty.com">info@tsdproperty.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} TSD Property Solutions. All rights
            reserved.
          </p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
