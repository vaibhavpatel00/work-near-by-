import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, Car, Bike, MapPin, Calendar, 
  Clock, IndianRupee, Users, Phone, Search, Wind, Cigarette, 
  Package, Music, Map as MapIcon, Globe, Loader2, User as UserIcon
} from 'lucide-react';
import { useRides } from '../../context/RideContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { COUNTRIES, getCountryByCode } from '../../data/countries';
import { formatAmount } from '../../utils/helpers';
import MapLocationPicker from '../../components/Map/MapLocationPicker';
import './OfferRide.css';

const STEPS = ['Vehicle', 'Route', 'Schedule', 'Seats & Price', 'Contact & Prefs', 'Review'];

const OfferRide = () => {
  const navigate = useNavigate();
  const { offerRide, showToast } = useRides();
  const { user, isAuthenticated } = useAuth();
  const { location } = useLocation();

  const userCountry = getCountryByCode(user?.country);

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState(null); // 'origin' | 'dest' | null

  const [form, setForm] = useState({
    vehicleType: 'car',
    originAddress: '',
    originLat: null,
    originLng: null,
    destAddress: '',
    destLat: null,
    destLng: null,
    date: '',
    time: '',
    seatsAvailable: 3,
    pricePerSeat: '',
    currencySymbol: userCountry?.currencySymbol || '₹',
    driverName: user?.name || '',
    driverPhone: user?.phone || '',
    description: '',
    preferences: {
      ac: true,
      smoking: false,
      luggage: true,
      music: true,
    },
  });

  // Place search states
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [searchingOrigin, setSearchingOrigin] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updatePreference = (key, value) => {
    setForm(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value },
    }));
  };

  // Search places using OpenStreetMap Nominatim globally
  const searchPlaces = async (query, setSuggestions, setSearching) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.info('Place search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Debounced origin search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(originQuery, setOriginSuggestions, setSearchingOrigin);
    }, 350);
    return () => clearTimeout(timer);
  }, [originQuery]);

  // Debounced destination search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(destQuery, setDestSuggestions, setSearchingDest);
    }, 350);
    return () => clearTimeout(timer);
  }, [destQuery]);

  const selectOrigin = (place) => {
    const parts = place.display_name.split(',');
    const areaName = parts.slice(0, 3).join(',').trim();
    setForm(prev => ({
      ...prev,
      originAddress: areaName,
      originLat: parseFloat(place.lat),
      originLng: parseFloat(place.lon),
    }));
    setOriginQuery(areaName);
    setOriginSuggestions([]);
  };

  const selectDestination = (place) => {
    const parts = place.display_name.split(',');
    const areaName = parts.slice(0, 3).join(',').trim();
    setForm(prev => ({
      ...prev,
      destAddress: areaName,
      destLat: parseFloat(place.lat),
      destLng: parseFloat(place.lon),
    }));
    setDestQuery(areaName);
    setDestSuggestions([]);
  };

  // Handle map selection
  const handleMapLocationSelect = (loc) => {
    if (mapPickerTarget === 'origin') {
      setForm(prev => ({
        ...prev,
        originAddress: loc.address,
        originLat: loc.lat,
        originLng: loc.lng,
      }));
      setOriginQuery(loc.address);
      setOriginSuggestions([]);
    } else if (mapPickerTarget === 'dest') {
      setForm(prev => ({
        ...prev,
        destAddress: loc.address,
        destLat: loc.lat,
        destLng: loc.lng,
      }));
      setDestQuery(loc.address);
      setDestSuggestions([]);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!form.vehicleType;
      case 1: return form.originAddress.length >= 2 && form.destAddress.length >= 2;
      case 2: return !!form.date && !!form.time;
      case 3: return Number(form.pricePerSeat) > 0 && Number(form.seatsAvailable) >= 1;
      case 4: return (form.driverPhone.trim().length >= 8) && (form.driverName.trim().length >= 2);
      case 5: return true;
      default: return false;
    }
  };

  const handlePublish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const departureDateTime = new Date(`${form.date}T${form.time}`).toISOString();

      await offerRide({
        vehicleType: form.vehicleType,
        origin: {
          address: form.originAddress,
          lat: form.originLat || location.lat,
          lng: form.originLng || location.lng,
        },
        destination: {
          address: form.destAddress,
          lat: form.destLat || 0,
          lng: form.destLng || 0,
        },
        departureDate: departureDateTime,
        seatsAvailable: Number(form.seatsAvailable),
        pricePerSeat: Number(form.pricePerSeat),
        currency: form.currencySymbol,
        description: form.description,
        ownerEmail: user?.email || '',
        driverName: form.driverName || user?.name || user?.email?.split('@')[0] || 'Driver',
        driverPhone: form.driverPhone || user?.phone || '',
        preferences: form.preferences,
      });

      navigate('/travel');
    } catch (err) {
      console.error('Publish ride error:', err);
      showToast('Ride published locally!', 'success');
      navigate('/travel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="offer-ride-page">
        {/* Back Button */}
        <button className="btn btn-ghost btn-sm mb-3" onClick={() => navigate('/travel')}>
          <ArrowLeft size={18} /> Back to Travel
        </button>

        <h1 className="offer-ride-heading">Offer a Ride</h1>

        {/* Progress Bar */}
        <div className="post-progress">
          {STEPS.map((s, i) => (
            <div key={s} className={`progress-step ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
              <div className="progress-dot">
                {i < step ? <Check size={12} /> : <span>{i + 1}</span>}
              </div>
              <span className="progress-label">{s}</span>
            </div>
          ))}
          <div className="progress-line">
            <div className="progress-line-fill" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="post-step-content animate-fade-in-up" key={step}>
          {/* Step 0: Vehicle Type */}
          {step === 0 && (
            <div className="step-vehicle">
              <h2>What vehicle are you driving?</h2>
              <p className="text-secondary text-sm">Select car or bike for your journey</p>

              <div className="vehicle-select-grid mt-6">
                <button
                  className={`vehicle-select-card ${form.vehicleType === 'car' ? 'selected' : ''}`}
                  onClick={() => { updateForm('vehicleType', 'car'); updateForm('seatsAvailable', 3); }}
                >
                  <div className="vehicle-select-icon car">
                    <Car size={40} />
                  </div>
                  <strong>Car</strong>
                  <span>1-7 passenger seats</span>
                </button>

                <button
                  className={`vehicle-select-card ${form.vehicleType === 'bike' ? 'selected' : ''}`}
                  onClick={() => { updateForm('vehicleType', 'bike'); updateForm('seatsAvailable', 1); }}
                >
                  <div className="vehicle-select-icon bike">
                    <Bike size={40} />
                  </div>
                  <strong>Bike / Motorcycle</strong>
                  <span>1 pillion seat</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Route */}
          {step === 1 && (
            <div className="step-route">
              <h2>Where are you driving?</h2>
              <p className="text-secondary text-sm">Set your starting point & destination (Type or pick on Map)</p>

              <div className="route-form mt-4">
                {/* Origin */}
                <div className="route-input-group">
                  <div className="route-dot origin-dot"></div>
                  <div className="route-input-wrapper">
                    <div className="input-with-map-btn">
                      <div className="input-icon-wrapper flex-1">
                        <Search size={16} className="input-icon" />
                        <input
                          type="text"
                          className="input-field"
                          placeholder="From where? (Starting city / area)"
                          value={originQuery || form.originAddress}
                          onChange={e => {
                            setOriginQuery(e.target.value);
                            updateForm('originAddress', e.target.value);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-pick-map-inline"
                        onClick={() => setMapPickerTarget('origin')}
                        title="Pick starting location on map"
                      >
                        <MapIcon size={16} /> Map
                      </button>
                    </div>

                    {searchingOrigin && <p className="search-hint">Searching places globally...</p>}
                    {originSuggestions.length > 0 && (
                      <div className="place-dropdown">
                        {originSuggestions.map((place, idx) => (
                          <button key={idx} className="place-dropdown-item" onClick={() => selectOrigin(place)}>
                            <MapPin size={14} color="#22c55e" />
                            <span>{place.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="route-connector-line"></div>

                {/* Destination */}
                <div className="route-input-group">
                  <div className="route-dot dest-dot"></div>
                  <div className="route-input-wrapper">
                    <div className="input-with-map-btn">
                      <div className="input-icon-wrapper flex-1">
                        <Search size={16} className="input-icon" />
                        <input
                          type="text"
                          className="input-field"
                          placeholder="To where? (Destination city / area)"
                          value={destQuery || form.destAddress}
                          onChange={e => {
                            setDestQuery(e.target.value);
                            updateForm('destAddress', e.target.value);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-pick-map-inline dest-map"
                        onClick={() => setMapPickerTarget('dest')}
                        title="Pick destination on map"
                      >
                        <MapIcon size={16} /> Map
                      </button>
                    </div>

                    {searchingDest && <p className="search-hint">Searching places globally...</p>}
                    {destSuggestions.length > 0 && (
                      <div className="place-dropdown">
                        {destSuggestions.map((place, idx) => (
                          <button key={idx} className="place-dropdown-item" onClick={() => selectDestination(place)}>
                            <MapPin size={14} color="#ef4444" />
                            <span>{place.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="step-schedule">
              <h2>When are you leaving?</h2>
              <p className="text-secondary text-sm">Set your departure date and time</p>

              <div className="grid-2-col mt-4">
                <div className="input-group">
                  <label className="input-label">Departure Date</label>
                  <div className="input-icon-wrapper">
                    <Calendar size={18} className="input-icon" />
                    <input
                      type="date"
                      className="input-field"
                      value={form.date}
                      onChange={e => updateForm('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Departure Time</label>
                  <div className="input-icon-wrapper">
                    <Clock size={18} className="input-icon" />
                    <input
                      type="time"
                      className="input-field"
                      value={form.time}
                      onChange={e => updateForm('time', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="input-group mt-4">
                <label className="input-label">Ride Description / Pickup Note (Optional)</label>
                <textarea
                  className="input-field"
                  placeholder="e.g. Leaving from Metro station, will take Highway, AC available..."
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  rows={3}
                  maxLength={300}
                />
              </div>
            </div>
          )}

          {/* Step 3: Seats & Price */}
          {step === 3 && (
            <div className="step-price">
              <h2>Seats & Price per Seat</h2>
              <p className="text-secondary text-sm">Set available seats and price in your currency</p>

              <div className="input-group mt-4">
                <label className="input-label">
                  <Users size={14} className="inline-icon" /> Available Seats for Passengers
                </label>
                {form.vehicleType === 'bike' ? (
                  <div className="seats-display">
                    <span className="seat-number">1</span>
                    <span className="text-xs text-secondary">Pillion seat (Bike)</span>
                  </div>
                ) : (
                  <div className="seats-selector">
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <button
                        key={num}
                        type="button"
                        className={`seat-btn ${form.seatsAvailable === num ? 'active' : ''}`}
                        onClick={() => updateForm('seatsAvailable', num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="input-group mt-6">
                <label className="input-label">Price per Seat</label>
                <div className="amount-input-wrapper">
                  <select
                    className="amount-currency-select"
                    value={form.currencySymbol}
                    onChange={e => updateForm('currencySymbol', e.target.value)}
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.currencySymbol}>
                        {c.flag} {c.currencySymbol} ({c.currency})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="amount-input"
                    placeholder="0"
                    value={form.pricePerSeat}
                    onChange={e => updateForm('pricePerSeat', e.target.value)}
                    min={0}
                  />
                </div>
                <span className="input-hint">
                  Total for {form.seatsAvailable} seat{form.seatsAvailable > 1 ? 's' : ''}: 
                  {' '}{formatAmount(Number(form.pricePerSeat) * form.seatsAvailable, form.currencySymbol)}
                </span>
              </div>
            </div>
          )}

          {/* Step 4: Contact & Preferences */}
          {step === 4 && (
            <div className="step-preferences">
              <h2>Driver Contact & Preferences</h2>
              <p className="text-secondary text-sm">Passengers will contact you regarding this ride</p>

              <div className="grid-2-col mt-4">
                <div className="input-group">
                  <label className="input-label">Your Name</label>
                  <div className="input-icon-wrapper">
                    <UserIcon size={18} className="input-icon" />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Your Full Name"
                      value={form.driverName}
                      onChange={e => updateForm('driverName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Your Phone Number</label>
                  <div className="input-icon-wrapper">
                    <Phone size={18} className="input-icon" />
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="+91 98765 43210"
                      value={form.driverPhone}
                      onChange={e => updateForm('driverPhone', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {form.vehicleType === 'car' && (
                <div className="preferences-grid mt-6">
                  <label className="pref-card glass-card">
                    <div className="pref-icon">
                      <Wind size={20} />
                    </div>
                    <div className="pref-info">
                      <strong>Air Conditioning (AC)</strong>
                      <span>AC available in car</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.preferences.ac}
                      onChange={e => updatePreference('ac', e.target.checked)}
                      className="pref-toggle"
                    />
                  </label>

                  <label className="pref-card glass-card">
                    <div className="pref-icon">
                      <Package size={20} />
                    </div>
                    <div className="pref-info">
                      <strong>Luggage Space</strong>
                      <span>Boot/trunk luggage space</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.preferences.luggage}
                      onChange={e => updatePreference('luggage', e.target.checked)}
                      className="pref-toggle"
                    />
                  </label>

                  <label className="pref-card glass-card">
                    <div className="pref-icon">
                      <Music size={20} />
                    </div>
                    <div className="pref-info">
                      <strong>Music Allowed</strong>
                      <span>OK with music on the journey</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.preferences.music}
                      onChange={e => updatePreference('music', e.target.checked)}
                      className="pref-toggle"
                    />
                  </label>

                  <label className="pref-card glass-card">
                    <div className="pref-icon">
                      <Cigarette size={20} />
                    </div>
                    <div className="pref-info">
                      <strong>Smoking Allowed</strong>
                      <span>Smoking allowed in vehicle</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={form.preferences.smoking}
                      onChange={e => updatePreference('smoking', e.target.checked)}
                      className="pref-toggle"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="step-review">
              <h2>Review & Publish</h2>
              <p className="text-secondary text-sm">Verify your ride details before publishing to all devices</p>

              <div className="review-card glass-card mt-4">
                <div className="review-row">
                  {form.vehicleType === 'car' ? <Car size={16} className="text-tertiary" /> : <Bike size={16} className="text-tertiary" />}
                  <div>
                    <span className="review-label">Vehicle</span>
                    <span className="review-value">{form.vehicleType === 'car' ? '🚗 Car' : '🏍️ Bike'}</span>
                  </div>
                </div>

                <div className="review-row">
                  <MapPin size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Route</span>
                    <span className="review-value">{form.originAddress} → {form.destAddress}</span>
                  </div>
                </div>

                <div className="review-row">
                  <Calendar size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Departure</span>
                    <span className="review-value">{form.date} at {form.time}</span>
                  </div>
                </div>

                <div className="review-row">
                  <Users size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Seats</span>
                    <span className="review-value">{form.seatsAvailable} seat{form.seatsAvailable > 1 ? 's' : ''} available</span>
                  </div>
                </div>

                <div className="review-row">
                  <IndianRupee size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Price per Seat</span>
                    <span className="review-value review-amount">{formatAmount(Number(form.pricePerSeat), form.currencySymbol)}</span>
                  </div>
                </div>

                <div className="review-row">
                  <Phone size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Driver Contact</span>
                    <span className="review-value">{form.driverName} • {form.driverPhone}</span>
                  </div>
                </div>

                {form.description && (
                  <div className="review-row">
                    <MapPin size={16} className="text-tertiary" />
                    <div>
                      <span className="review-label">Notes</span>
                      <span className="review-value">{form.description}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="post-actions">
          {step > 0 && (
            <button className="btn btn-outline" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
              <ArrowLeft size={18} />
              Back
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              style={{ marginLeft: 'auto' }}
            >
              Next
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="btn btn-accent btn-lg"
              onClick={handlePublish}
              disabled={isSubmitting}
              style={{ marginLeft: 'auto', minWidth: '180px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Publishing...
                </>
              ) : (
                '🚀 Publish Ride'
              )}
            </button>
          )}
        </div>

        {/* Map Location Picker Modal */}
        {mapPickerTarget && (
          <MapLocationPicker
            isOpen={Boolean(mapPickerTarget)}
            onClose={() => setMapPickerTarget(null)}
            onSelectLocation={handleMapLocationSelect}
            title={mapPickerTarget === 'origin' ? '📍 Select Starting Location (Origin)' : '🏁 Select Drop Location (Destination)'}
            pinColor={mapPickerTarget === 'origin' ? '#22c55e' : '#ef4444'}
            initialLat={mapPickerTarget === 'origin' ? (form.originLat || location.lat) : (form.destLat || location.lat)}
            initialLng={mapPickerTarget === 'origin' ? (form.originLng || location.lng) : (form.destLng || location.lng)}
            initialAddress={mapPickerTarget === 'origin' ? form.originAddress : form.destAddress}
            showRadius={0}
          />
        )}
      </div>
    </div>
  );
};

export default OfferRide;
