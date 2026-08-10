import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Check, MapPin, Clock, Phone, MessageSquare, 
  Wrench, Zap, Award, Sparkles, AlertCircle, ShieldCheck, 
  Loader2, Map as MapIcon, Calendar, DollarSign
} from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { useWorkers } from '../../context/WorkerContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { COUNTRIES } from '../../data/countries';
import MapLocationPicker from '../../components/Map/MapLocationPicker';
import './RegisterWorker.css';

const RegisterWorker = () => {
  const navigate = useNavigate();
  const { registerWorker, myWorkerProfile, showToast } = useWorkers();
  const { user, isAuthenticated } = useAuth();
  const { location } = useLocation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [form, setForm] = useState({
    id: myWorkerProfile?.id || '',
    name: myWorkerProfile?.name || user?.name || '',
    profession: myWorkerProfile?.profession || 'electrician',
    customProfession: myWorkerProfile?.customProfession || '',
    phone: myWorkerProfile?.phone || user?.phone || '',
    whatsapp: myWorkerProfile?.whatsapp || user?.phone || '',
    workingHoursStart: '09:00',
    workingHoursEnd: '20:00',
    workingDays: myWorkerProfile?.workingDays || 'Monday - Saturday',
    experience: myWorkerProfile?.experience || '3+ Years',
    livingArea: myWorkerProfile?.livingArea || location?.address || '',
    locationCoords: myWorkerProfile?.location || { address: location?.address || '', lat: location.lat, lng: location.lng },
    rate: myWorkerProfile?.rate || 250,
    rateUnit: myWorkerProfile?.rateUnit || 'per visit',
    currency: myWorkerProfile?.currency || '₹',
    description: myWorkerProfile?.description || '',
    emergencyAvailable: myWorkerProfile?.emergencyAvailable ?? true,
  });

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleMapLocationSelect = (loc) => {
    setForm(prev => ({
      ...prev,
      livingArea: loc.address,
      locationCoords: {
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please login to register your worker profile', 'error');
      navigate('/login');
      return;
    }

    if (!form.name.trim() || !form.phone.trim() || !form.livingArea.trim()) {
      showToast('Please fill all required details', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const workingHoursFormatted = `${form.workingHoursStart} - ${form.workingHoursEnd}`;
      await registerWorker({
        ...form,
        workingHours: workingHoursFormatted,
        location: form.locationCoords,
      });

      navigate('/explore');
    } catch (err) {
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="register-worker-page">
        {/* Header */}
        <div className="register-header animate-fade-in">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>
          <h1>{myWorkerProfile ? 'Edit Worker Profile' : 'List Your Skills & Services'}</h1>
          <p className="text-secondary">
            Register as a skilled worker (Electrician, Bike Mechanic, Plumber, etc.) so people in your area can find and hire you directly.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-worker-form glass-card animate-fade-in-up">
          {/* 1. Basic Info */}
          <div className="form-section">
            <h3 className="section-title">
              <Award size={18} className="text-accent" /> 1. Professional Identity
            </h3>

            <div className="input-group mt-3">
              <label className="input-label">Full Name / Business Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Ramesh Kumar (Ramesh Electricals)"
                value={form.name}
                onChange={e => updateForm('name', e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Your Trade / Skill Profession *</label>
              <select
                className="input-field select-profession"
                value={form.profession}
                onChange={e => updateForm('profession', e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {form.profession === 'other' && (
              <div className="input-group animate-fade-in">
                <label className="input-label">Specify Your Profession / Skill</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Mobile Repair, Welding, Tile Fitting..."
                  value={form.customProfession}
                  onChange={e => updateForm('customProfession', e.target.value)}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Experience</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 5+ Years Experience, Certified Technician"
                value={form.experience}
                onChange={e => updateForm('experience', e.target.value)}
              />
            </div>
          </div>

          {/* 2. Contact Details */}
          <div className="form-section mt-4">
            <h3 className="section-title">
              <Phone size={18} className="text-accent" /> 2. Direct Contact Details
            </h3>

            <div className="grid-2-col mt-3">
              <div className="input-group">
                <label className="input-label">Mobile Phone Number (For Calls) *</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={e => updateForm('phone', e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">WhatsApp Number *</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={form.whatsapp}
                  onChange={e => updateForm('whatsapp', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. Living Area & Location */}
          <div className="form-section mt-4">
            <h3 className="section-title">
              <MapPin size={18} className="text-accent" /> 3. Living Area & Service Location
            </h3>

            <div className="input-group mt-3">
              <label className="input-label">Living Area / Town / Colony *</label>
              <div className="input-with-btn">
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Kondapur Main Road, Hitech City, Hyderabad"
                  value={form.livingArea}
                  onChange={e => updateForm('livingArea', e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline map-picker-trigger"
                  onClick={() => setShowMapPicker(true)}
                >
                  <MapIcon size={16} /> Map Pin
                </button>
              </div>
              <span className="input-hint">Clients in a 50 km radius will discover your services</span>
            </div>
          </div>

          {/* 4. Working Hours & Charges */}
          <div className="form-section mt-4">
            <h3 className="section-title">
              <Clock size={18} className="text-accent" /> 4. Working Hours & Service Rates
            </h3>

            <div className="grid-2-col mt-3">
              <div className="input-group">
                <label className="input-label">Working Time (From - To)</label>
                <div className="time-range-row">
                  <input
                    type="time"
                    className="input-field"
                    value={form.workingHoursStart}
                    onChange={e => updateForm('workingHoursStart', e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    className="input-field"
                    value={form.workingHoursEnd}
                    onChange={e => updateForm('workingHoursEnd', e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Working Days</label>
                <select
                  className="input-field"
                  value={form.workingDays}
                  onChange={e => updateForm('workingDays', e.target.value)}
                >
                  <option value="Monday - Saturday">Monday - Saturday</option>
                  <option value="All 7 Days (Including Sunday)">All 7 Days (Including Sunday)</option>
                  <option value="Monday - Friday">Monday - Friday</option>
                  <option value="Weekends Only (Sat-Sun)">Weekends Only (Sat-Sun)</option>
                </select>
              </div>
            </div>

            <div className="grid-2-col mt-3">
              <div className="input-group">
                <label className="input-label">Visiting Charges / Starting Rate</label>
                <div className="rate-input-group">
                  <select
                    className="currency-select"
                    value={form.currency}
                    onChange={e => updateForm('currency', e.target.value)}
                  >
                    <option value="₹">₹ (INR)</option>
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="£">£ (GBP)</option>
                    <option value="د.إ">AED</option>
                  </select>
                  <input
                    type="number"
                    className="input-field rate-amount-input"
                    placeholder="250"
                    value={form.rate}
                    onChange={e => updateForm('rate', e.target.value)}
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Rate Type / Unit</label>
                <select
                  className="input-field"
                  value={form.rateUnit}
                  onChange={e => updateForm('rateUnit', e.target.value)}
                >
                  <option value="per visit">Per Visit / Inspection</option>
                  <option value="per hour">Per Hour</option>
                  <option value="per day">Per Day (Full Day)</option>
                  <option value="per service">Per Service / Job</option>
                </select>
              </div>
            </div>

            {/* Emergency Toggle */}
            <div className="checkbox-card mt-3">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.emergencyAvailable}
                  onChange={e => updateForm('emergencyAvailable', e.target.checked)}
                />
                <div>
                  <strong>⚡ 24/7 Emergency Service Available</strong>
                  <p className="text-xs text-secondary">Show an instant availability badge for urgent breakdown repairs</p>
                </div>
              </label>
            </div>
          </div>

          {/* 5. Description & Services Offered */}
          <div className="form-section mt-4">
            <h3 className="section-title">
              <Sparkles size={18} className="text-accent" /> 5. Services & Specialization
            </h3>

            <div className="input-group mt-3">
              <label className="input-label">Description of Your Work & Skills</label>
              <textarea
                className="input-field"
                placeholder="List the specific services you provide (e.g. Complete home wiring, switch replacement, inverter repair, motorcycle engine overhaul, brake service, water pipe leak fix...)"
                value={form.description}
                onChange={e => updateForm('description', e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions mt-5">
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spin" /> Saving Profile...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} /> {myWorkerProfile ? 'Update Worker Profile' : 'Publish Worker Profile'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Map Picker Modal */}
        {showMapPicker && (
          <MapLocationPicker
            isOpen={showMapPicker}
            onClose={() => setShowMapPicker(false)}
            onSelectLocation={handleMapLocationSelect}
            title="📍 Select Your Living Area / Work Base"
            pinColor="#3b82f6"
            initialLat={form.locationCoords.lat || location.lat}
            initialLng={form.locationCoords.lng || location.lng}
            initialAddress={form.livingArea}
          />
        )}
      </div>
    </div>
  );
};

export default RegisterWorker;
