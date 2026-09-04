import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { toast } from "react-toastify";
import { FiUpload, FiX, FiPlus, FiSave, FiArrowLeft } from "react-icons/fi";
import TourBuilder360 from "../components/Tourbuilder360";

const CATEGORIES = [
  { value: "short_term_rent", label: "Short Term Rent" },
  { value: "long_term_rent", label: "Long Term Rent" },
  { value: "sale", label: "Sale" },
];

const PROPERTY_TYPES = {
  short_term_rent: [
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
  ],
  long_term_rent: [
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "commercial", label: "Commercial" },
  ],
  sale: [
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "land", label: "Land" },
    { value: "commercial", label: "Commercial" },
  ],
};

const ROOM_OPTIONS = [
  "Living Room",
  "Bedroom 1",
  "Bedroom 2",
  "Bedroom 3",
  "Bedroom 4",
  "Master Bedroom",
  "Kitchen",
  "Bathroom 1",
  "Bathroom 2",
  "Bathroom 3",
  "Dining Room",
  "Balcony",
  "Terrace",
  "Garden",
  "Garage",
  "Office / Study",
  "Laundry Room",
  "Entrance / Lobby",
  "Pool Area",
  "Rooftop",
  "Full Property View",
  "Other",
];

const INITIAL_FORM = {
  category: "short_term_rent",
  property_type: "apartment",
  building_name: "",
  location: "",
  bedrooms: "",
  bathrooms: "",
  floor_area: "",
  land_area: "",
  num_floors: "",
  story_type: "",
  furnished: "",
  max_occupancy: "",
  min_stay: "",
  per_night_rate: "",
  per_week_rate: "",
  per_month_rate: "",
  rent_per_month: "",
  security_deposit: "",
  upfront_rental: "",
  rental_period: "",
  sale_price: "",
  access_road_width: "",
  parking: "",
  description: "",
  status: "active",
};

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const hasHydratedDraftRef = useRef(false);
  const consumedCreatedTourRef = useRef(false);
  const isEdit = Boolean(id);
  const draftKey = isEdit
    ? `tsd_property_form_draft_edit_${id}`
    : "tsd_property_form_draft_new";

  const [form, setForm] = useState(INITIAL_FORM);
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  const [virtualTours, setVirtualTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [showInlineTourBuilder, setShowInlineTourBuilder] = useState(false);

  const getImageDraftStore = () => {
    if (!window.__tsdPropertyFormImageDrafts) {
      window.__tsdPropertyFormImageDrafts = {};
    }
    return window.__tsdPropertyFormImageDrafts;
  };

  const persistDraft = () => {
    const imageDraftStore = getImageDraftStore();
    imageDraftStore[draftKey] = newImages.map(({ file }) => file);
    const payload = {
      form,
      virtualTours,
      existingImages,
      removedImageIds,
    };
    sessionStorage.setItem(draftKey, JSON.stringify(payload));
  };

  useEffect(() => {
    const rawDraft = sessionStorage.getItem(draftKey);
    if (!rawDraft) {
      setDraftHydrated(true);
      return;
    }

    try {
      const draft = JSON.parse(rawDraft);
      hasHydratedDraftRef.current = true;
      if (draft?.form) {
        setForm((prev) => ({ ...prev, ...draft.form }));
      }
      if (Array.isArray(draft?.virtualTours)) {
        setVirtualTours(draft.virtualTours);
      }
      if (Array.isArray(draft?.existingImages)) {
        setExistingImages(draft.existingImages);
      }
      if (Array.isArray(draft?.removedImageIds)) {
        setRemovedImageIds(draft.removedImageIds);
      }
      const imageDraftStore = getImageDraftStore();
      const cachedFiles = imageDraftStore[draftKey];
      if (Array.isArray(cachedFiles) && cachedFiles.length) {
        const restored = cachedFiles.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
        }));
        setNewImages(restored);
      }
    } catch {
      // Ignore invalid draft payloads
    } finally {
      setDraftHydrated(true);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftHydrated) return;
    persistDraft();
  }, [
    draftHydrated,
    draftKey,
    form,
    virtualTours,
    existingImages,
    removedImageIds,
    newImages,
  ]);

  useEffect(() => {
    if (!isEdit) return;
    if (hasHydratedDraftRef.current) {
      setFetching(false);
      return;
    }
    api
      .get(`/properties/${id}`)
      .then(({ data }) => {
        const formData = {};
        Object.keys(INITIAL_FORM).forEach((key) => {
          formData[key] = data[key] ?? INITIAL_FORM[key];
        });
        setForm(formData);
        setExistingImages(data.images || []);
        setVirtualTours(
          data.virtual_tours?.map((t) => ({
            room_name: t.room_name,
            tour_url: t.tour_url,
          })) || [],
        );
      })
      .catch(() => {
        toast.error("Property not found");
        navigate("/admin/properties");
      })
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  useEffect(() => {
    if (consumedCreatedTourRef.current) return;
    const savedTourRaw = sessionStorage.getItem("tsd_created_tour");
    if (!savedTourRaw) return;

    try {
      const savedTour = JSON.parse(savedTourRaw);
      if (!savedTour?.tour_url) return;

      let wasAdded = false;
      setVirtualTours((prev) => {
        if (prev.some((t) => t.tour_url === savedTour.tour_url)) return prev;
        wasAdded = true;
        const nextTours = [
          ...prev,
          {
            room_name: savedTour.room_name || "360 Panorama",
            tour_url: savedTour.tour_url,
          },
        ];
        return nextTours;
      });
      if (wasAdded) {
        toast.success("360° panorama linked from Tour Builder");
      }
      consumedCreatedTourRef.current = true;
      // Consume this payload once so new forms do not inherit old tours.
      sessionStorage.removeItem("tsd_created_tour");
    } catch {
      // Ignore malformed session payload
    } finally {
      consumedCreatedTourRef.current = true;
    }
  }, [draftKey, form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset property_type when category changes
      if (name === "category") {
        const types = PROPERTY_TYPES[value];
        if (!types.find((t) => t.value === prev.property_type)) {
          updated.property_type = types[0].value;
        }
      }
      return updated;
    });
  };

  const showField = (field) => {
    const { category, property_type } = form;
    const isLand = property_type === "land";
    const isCommercial = property_type === "commercial";

    switch (field) {
      case "building_name":
        return !isLand;
      case "location":
        return true;
      case "bedrooms":
      case "bathrooms":
        return !isLand && !isCommercial;
      case "floor_area":
        return !isLand;
      case "story_type":
        return (
          (category === "short_term_rent" || category === "long_term_rent") &&
          !isLand &&
          !isCommercial
        );
      case "max_occupancy":
        return category !== "sale" && !isLand;
      case "min_stay":
        return category === "short_term_rent";
      case "per_night_rate":
      case "per_week_rate":
      case "per_month_rate":
        return category === "short_term_rent";
      case "furnished":
        return (
          category === "long_term_rent" || (category === "sale" && !isLand)
        );
      case "rent_per_month":
        return category === "long_term_rent";
      case "security_deposit":
        return category !== "sale";
      case "upfront_rental":
      case "rental_period":
        return category === "long_term_rent";
      case "land_area":
        return category === "sale";
      case "num_floors":
        return category === "sale" && !isLand;
      case "sale_price":
        return category === "sale";
      case "access_road_width":
        return category === "sale";
      case "parking":
        return category === "sale" && !isLand;
      default:
        return true;
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...previews]);
    e.target.value = "";
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (imgId) => {
    setRemovedImageIds((prev) => [...prev, imgId]);
    setExistingImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const addTour = () => {
    setVirtualTours((prev) => [
      ...prev,
      { room_name: "Living Room", tour_url: "" },
    ]);
  };

  const updateTour = (index, field, value) => {
    setVirtualTours((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    );
  };

  const removeTour = (index) => {
    setVirtualTours((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInlineTourLinked = (savedTour) => {
    if (!savedTour?.tour_url) return;
    setVirtualTours((prev) => {
      if (prev.some((t) => t.tour_url === savedTour.tour_url)) return prev;
      return [
        ...prev,
        {
          room_name: savedTour.room_name || "360 Panorama",
          tour_url: savedTour.tour_url,
        },
      ];
    });
    toast.success("360° panorama linked from Tour Builder");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category || !form.property_type) {
      toast.error("Please select category and property type");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, val]) => {
        if (val !== "" && val !== null && val !== undefined) {
          formData.append(key, val);
        }
      });

      newImages.forEach(({ file }) => formData.append("images", file));

      const validTours = virtualTours.filter((t) => t.tour_url.trim());
      formData.append("virtual_tours", JSON.stringify(validTours));

      if (isEdit && removedImageIds.length > 0) {
        formData.append("removed_images", JSON.stringify(removedImageIds));
      }

      if (isEdit) {
        await api.put(`/properties/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Property updated successfully");
        sessionStorage.removeItem(draftKey);
        delete getImageDraftStore()[draftKey];
      } else {
        await api.post("/properties", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Property created successfully");
        sessionStorage.removeItem(draftKey);
        delete getImageDraftStore()[draftKey];
      }

      navigate("/admin/properties");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save property");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [newImages]);

  if (fetching) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="form-page">
      <div style={{ marginBottom: 20 }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigate("/admin/properties")}
        >
          <FiArrowLeft size={14} /> Back to Properties
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Category & Type */}
        <div className="form-card">
          <h3>Property Classification</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Property Type *</label>
              <select
                name="property_type"
                value={form.property_type}
                onChange={handleChange}
              >
                {PROPERTY_TYPES[form.category].map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Basic Details */}
        <div className="form-card">
          <h3>Property Details</h3>
          <div className="form-grid">
            {showField("building_name") && (
              <div className="form-group">
                <label>
                  {form.property_type === "apartment"
                    ? "Apartment Building Name"
                    : "Property Name"}
                </label>
                <input
                  type="text"
                  name="building_name"
                  value={form.building_name}
                  onChange={handleChange}
                  placeholder="e.g. Sapphire Residencies"
                />
              </div>
            )}
            {showField("location") && (
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Colombo 07, Sri Lanka"
                />
              </div>
            )}
            {showField("bedrooms") && (
              <div className="form-group">
                <label>No. of Bedrooms</label>
                <input
                  type="number"
                  name="bedrooms"
                  min="0"
                  value={form.bedrooms}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                />
              </div>
            )}
            {showField("bathrooms") && (
              <div className="form-group">
                <label>No. of Bathrooms</label>
                <input
                  type="number"
                  name="bathrooms"
                  min="0"
                  value={form.bathrooms}
                  onChange={handleChange}
                  placeholder="e.g. 2"
                />
              </div>
            )}
            {showField("floor_area") && (
              <div className="form-group">
                <label>Floor Area (sq ft)</label>
                <input
                  type="number"
                  name="floor_area"
                  min="0"
                  step="0.01"
                  value={form.floor_area}
                  onChange={handleChange}
                  placeholder="e.g. 1500"
                />
              </div>
            )}
            {showField("land_area") && (
              <div className="form-group">
                <label>Land Area (perches / sq ft)</label>
                <input
                  type="text"
                  name="land_area"
                  value={form.land_area}
                  onChange={handleChange}
                  placeholder="e.g. 10 perches"
                />
              </div>
            )}
            {showField("num_floors") && (
              <div className="form-group">
                <label>No. of Floors</label>
                <input
                  type="number"
                  name="num_floors"
                  min="1"
                  value={form.num_floors}
                  onChange={handleChange}
                  placeholder="e.g. 2"
                />
              </div>
            )}
            {showField("story_type") && (
              <div className="form-group">
                <label>Single / Two Story</label>
                <select
                  name="story_type"
                  value={form.story_type}
                  onChange={handleChange}
                >
                  <option value="">Select…</option>
                  <option value="single">Single Story</option>
                  <option value="two">Two Story</option>
                </select>
              </div>
            )}
            {showField("furnished") && (
              <div className="form-group">
                <label>Furnished / Unfurnished</label>
                <select
                  name="furnished"
                  value={form.furnished}
                  onChange={handleChange}
                >
                  <option value="">Select…</option>
                  <option value="furnished">Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>
            )}
            {showField("max_occupancy") && (
              <div className="form-group">
                <label>Maximum Occupancy</label>
                <input
                  type="number"
                  name="max_occupancy"
                  min="1"
                  value={form.max_occupancy}
                  onChange={handleChange}
                  placeholder="e.g. 6"
                />
              </div>
            )}
            {showField("access_road_width") && (
              <div className="form-group">
                <label>Access Road Width</label>
                <input
                  type="text"
                  name="access_road_width"
                  value={form.access_road_width}
                  onChange={handleChange}
                  placeholder="e.g. 20 ft"
                />
              </div>
            )}
            {showField("parking") && (
              <div className="form-group">
                <label>Parking</label>
                <input
                  type="text"
                  name="parking"
                  value={form.parking}
                  onChange={handleChange}
                  placeholder="e.g. 2 car garage"
                />
              </div>
            )}
            <div className="form-group full">
              <label>Description (optional)</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Brief description of the property…"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="form-card">
          <h3>Pricing & Terms</h3>
          <div className="form-grid">
            {showField("min_stay") && (
              <div className="form-group">
                <label>Minimum Stay (nights)</label>
                <input
                  type="number"
                  name="min_stay"
                  min="1"
                  value={form.min_stay}
                  onChange={handleChange}
                  placeholder="e.g. 2"
                />
              </div>
            )}
            {showField("per_night_rate") && (
              <div className="form-group">
                <label>Per Night Rate (Rs.)</label>
                <input
                  type="number"
                  name="per_night_rate"
                  min="0"
                  step="0.01"
                  value={form.per_night_rate}
                  onChange={handleChange}
                  placeholder="e.g. 15000"
                />
              </div>
            )}
            {showField("per_week_rate") && (
              <div className="form-group">
                <label>Per Week Rate (Rs.)</label>
                <input
                  type="number"
                  name="per_week_rate"
                  min="0"
                  step="0.01"
                  value={form.per_week_rate}
                  onChange={handleChange}
                  placeholder="e.g. 90000"
                />
              </div>
            )}
            {showField("per_month_rate") && (
              <div className="form-group">
                <label>Per Month Rate (Rs.)</label>
                <input
                  type="number"
                  name="per_month_rate"
                  min="0"
                  step="0.01"
                  value={form.per_month_rate}
                  onChange={handleChange}
                  placeholder="e.g. 300000"
                />
              </div>
            )}
            {showField("rent_per_month") && (
              <div className="form-group">
                <label>Rent Per Month (Rs.)</label>
                <input
                  type="number"
                  name="rent_per_month"
                  min="0"
                  step="0.01"
                  value={form.rent_per_month}
                  onChange={handleChange}
                  placeholder="e.g. 150000"
                />
              </div>
            )}
            {showField("security_deposit") && (
              <div className="form-group">
                <label>Security Deposit (Rs.)</label>
                <input
                  type="number"
                  name="security_deposit"
                  min="0"
                  step="0.01"
                  value={form.security_deposit}
                  onChange={handleChange}
                  placeholder="e.g. 100000"
                />
              </div>
            )}
            {showField("upfront_rental") && (
              <div className="form-group">
                <label>Upfront Rental Amount (Rs.)</label>
                <input
                  type="number"
                  name="upfront_rental"
                  min="0"
                  step="0.01"
                  value={form.upfront_rental}
                  onChange={handleChange}
                  placeholder="e.g. 300000"
                />
              </div>
            )}
            {showField("rental_period") && (
              <div className="form-group">
                <label>Rental Period</label>
                <input
                  type="text"
                  name="rental_period"
                  value={form.rental_period}
                  onChange={handleChange}
                  placeholder="e.g. 12 months"
                />
              </div>
            )}
            {showField("sale_price") && (
              <div className="form-group">
                <label>Sale Price (Rs.)</label>
                <input
                  type="number"
                  name="sale_price"
                  min="0"
                  step="0.01"
                  value={form.sale_price}
                  onChange={handleChange}
                  placeholder="e.g. 45000000"
                />
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="form-card">
          <h3>Property Images</h3>
          <div
            className="image-upload-area"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUpload size={28} />
            <p>Click to upload images (JPG, PNG, WebP — max 10MB each)</p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleImageSelect}
          />

          {(existingImages.length > 0 || newImages.length > 0) && (
            <div className="image-preview-grid">
              {existingImages.map((img) => (
                <div key={img.id} className="image-preview-item">
                  <img src={img.image_path} alt="" />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeExistingImage(img.id)}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
              {newImages.map((img, i) => (
                <div key={`new-${i}`} className="image-preview-item">
                  <img src={img.preview} alt="" />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeNewImage(i)}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Virtual Tours */}
        <div className="form-card">
          <h3>360° Virtual Tours</h3>
          <p
            style={{
              fontSize: ".85rem",
              color: "var(--text-secondary)",
              marginBottom: 16,
              marginTop: -8,
            }}
          >
            Add Insta360 or similar 360° view links and specify which room each
            link represents.
          </p>

          <div className="tour-list">
            {virtualTours.map((tour, i) => (
              <div key={i} className="tour-item">
                <select
                  value={tour.room_name}
                  onChange={(e) => updateTour(i, "room_name", e.target.value)}
                >
                  {ROOM_OPTIONS.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
                <input
                  type="url"
                  value={tour.tour_url}
                  onChange={(e) => updateTour(i, "tour_url", e.target.value)}
                  placeholder="https://cloud-sg.insta360.com/share/sg/..."
                />
                <button
                  type="button"
                  className="remove-tour"
                  onClick={() => removeTour(i)}
                >
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button
              type="button"
              className="add-tour-btn"
              onClick={addTour}
            >
              <FiPlus size={16} /> Add 360° Tour Link
            </button>
            <button
              type="button"
              className="add-tour-btn"
              onClick={() => setShowInlineTourBuilder((prev) => !prev)}
            >
              <FiPlus size={16} />{" "}
              {showInlineTourBuilder ? "Hide 360° Builder" : "Create 360° Panorama"}
            </button>
          </div>

          {showInlineTourBuilder && (
            <div style={{ marginTop: 16 }}>
              <TourBuilder360
                embedded
                linkedPropertyId={isEdit ? Number(id) : null}
                onTourLinked={handleInlineTourLinked}
                onClose={() => setShowInlineTourBuilder(false)}
              />
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              sessionStorage.removeItem(draftKey);
              delete getImageDraftStore()[draftKey];
              navigate("/admin/properties");
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-green btn-lg"
            disabled={loading}
          >
            <FiSave size={16} />
            {loading
              ? "Saving…"
              : isEdit
                ? "Update Property"
                : "Create Property"}
          </button>
        </div>
      </form>
    </div>
  );
}
