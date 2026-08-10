import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, MapPin, Calendar, Clock, IndianRupee, 
  FileText, Tag, Edit3, Image as ImageIcon, Paperclip, X, Phone, Mail, 
  MessageSquare, Hourglass, Users, DollarSign 
} from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { useGigs } from '../../context/GigContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { COUNTRIES, getCountryByCode } from '../../data/countries';
import { formatAmount, formatDate } from '../../utils/helpers';
import './PostGig.css';

const STEPS = ['Category', 'Details & Files', 'Schedule & Expiry', 'Amount', 'Contact Info', 'Review'];

const PostGig = () => {
  const navigate = useNavigate();
  const { postGig, showToast } = useGigs();
  const { user, isAuthenticated } = useAuth();
  const { location } = useLocation();

  const userCountry = getCountryByCode(user?.country) || COUNTRIES[0];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    category: '',
    customCategory: '',
    title: '',
    description: '',
    attachments: [],
    date: '',
    time: '',
    duration: '',
    expiryDate: '',
    maxApplications: 5,
    amount: '',
    currencySymbol: userCountry?.currencySymbol || '$',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    whatsappPref: true,
    callPref: true,
    location: location ? { ...location } : { address: 'Nearby', lat: 17.385, lng: 78.4867 },
  });

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Image & Document handling
  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const newAttachment = {
          id: Date.now() + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: type, // 'image' or 'document'
          url: uploadEvent.target.result,
        };
        setForm(prev => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id) => {
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== id),
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        if (!form.category) return false;
        if (form.category === 'other') return form.customCategory.trim().length >= 2;
        return true;
      case 1: return form.title.length >= 5 && form.description.length >= 10;
      case 2: return !!form.date && !!form.duration && !!form.expiryDate;
      case 3: return Number(form.amount) > 0;
      case 4: return form.contactPhone.length >= 8 && form.contactEmail.includes('@');
      case 5: return true;
      default: return false;
    }
  };

  const handlePublish = () => {
    if (!isAuthenticated) {
      showToast('Please login to post a requirement', 'error');
      navigate('/login');
      return;
    }

    const dateTime = form.time
      ? new Date(`${form.date}T${form.time}`).toISOString()
      : new Date(`${form.date}T09:00`).toISOString();

    const finalCategory = form.category === 'other' && form.customCategory.trim()
      ? form.customCategory.trim()
      : form.category;

    postGig({
      title: form.title,
      description: form.description,
      category: finalCategory,
      amount: Number(form.amount),
      currency: form.currencySymbol,
      currencySymbol: form.currencySymbol,
      date: dateTime,
      duration: form.duration,
      location: form.location || location,
      attachments: form.attachments,
      expiryDate: form.expiryDate,
      maxApplications: Number(form.maxApplications),
      contactDetails: {
        phone: form.contactPhone,
        email: form.contactEmail,
        whatsapp: form.whatsappPref,
        allowCall: form.callPref,
      },
    });

    navigate('/');
  };

  const selectedCategoryObj = CATEGORIES.find(c => c.id === form.category);
  const categoryDisplayName = form.category === 'other'
    ? (form.customCategory.trim() || 'Other Work')
    : (selectedCategoryObj?.name || form.category || 'General Work');

  return (
    <div className="page-content">
      <div className="post-page">
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
          {/* Step 0: Category */}
          {step === 0 && (
            <div className="step-category">
              <h2>What type of work?</h2>
              <p className="text-secondary text-sm">Select a category or choose Other for custom requirements</p>
              
              <div className="category-select-grid">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = form.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`cat-select-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => updateForm('category', cat.id)}
                    >
                      <span className="cat-select-icon"><Icon size={24} /></span>
                      <div className="cat-select-info">
                        <span className="cat-select-name">{cat.name}</span>
                      </div>
                      {isSelected && (
                        <span className="cat-check-badge">
                          <Check size={14} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {form.category === 'other' && (
                <div className="custom-category-box animate-fade-in mt-4">
                  <label className="input-label">Custom Work Category</label>
                  <div className="input-icon-wrapper">
                    <Edit3 size={18} className="input-icon" />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Graphic Designer, Welder, Yoga Trainer..."
                      value={form.customCategory}
                      onChange={e => updateForm('customCategory', e.target.value)}
                      maxLength={50}
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Details & Files */}
          {step === 1 && (
            <div className="step-details">
              <h2>Describe the work & Attach Files</h2>
              <p className="text-secondary text-sm">Help workers understand what you need by sharing details, images, or documents</p>

              <div className="input-group mt-4">
                <label className="input-label">Work Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Driver needed for airport drop today"
                  value={form.title}
                  onChange={e => updateForm('title', e.target.value)}
                  maxLength={100}
                />
                <span className="char-count">{form.title.length}/100</span>
              </div>

              <div className="input-group">
                <label className="input-label">Detailed Description</label>
                <textarea
                  className="input-field"
                  placeholder="Describe your requirement in detail..."
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  rows={4}
                  maxLength={600}
                />
                <span className="char-count">{form.description.length}/600</span>
              </div>

              {/* Attachments Section */}
              <div className="attachments-section mt-4">
                <label className="input-label">Publish Images & Documents (Optional)</label>
                
                <div className="attachment-buttons-row">
                  <label className="btn btn-outline btn-sm attach-btn">
                    <ImageIcon size={16} /> Add Image
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => handleFileUpload(e, 'image')}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <label className="btn btn-outline btn-sm attach-btn">
                    <Paperclip size={16} /> Add Document
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      multiple
                      onChange={e => handleFileUpload(e, 'document')}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {/* Previews List */}
                {form.attachments.length > 0 && (
                  <div className="attachments-preview-grid mt-3">
                    {form.attachments.map(att => (
                      <div key={att.id} className="attachment-chip">
                        {att.type === 'image' ? (
                          <img src={att.url} alt={att.name} className="attachment-thumb" />
                        ) : (
                          <FileText size={16} className="text-secondary" />
                        )}
                        <span className="attachment-filename">{att.name}</span>
                        <button
                          type="button"
                          className="attachment-remove-btn"
                          onClick={() => removeAttachment(att.id)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Schedule & Expiry */}
          {step === 2 && (
            <div className="step-schedule">
              <h2>Schedule & Post Expiry</h2>
              <p className="text-secondary text-sm">Set the job timing, expiry date, and maximum application limit</p>

              <div className="grid-2-col mt-4">
                <div className="input-group">
                  <label className="input-label">Work Date</label>
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
                  <label className="input-label">Time (optional)</label>
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

              <div className="input-group mt-3">
                <label className="input-label">Duration</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 3 hours, Full day, 2 days"
                  value={form.duration}
                  onChange={e => updateForm('duration', e.target.value)}
                />
              </div>

              {/* Expiry & Limit Rules */}
              <div className="post-rules-card glass-card mt-4">
                <h3><Hourglass size={16} className="text-accent" /> Post Expiry & Application Limits</h3>
                
                <div className="grid-2-col mt-3">
                  <div className="input-group">
                    <label className="input-label">Expiry Date & Time</label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      value={form.expiryDate}
                      onChange={e => updateForm('expiryDate', e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <span className="input-hint">Post auto-expires after this time</span>
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      <Users size={14} className="inline-icon" /> Max Applications Limit
                    </label>
                    <select
                      className="input-field"
                      value={form.maxApplications}
                      onChange={e => updateForm('maxApplications', e.target.value)}
                    >
                      <option value={1}>1 Application (Exclusive)</option>
                      <option value={3}>3 Applications</option>
                      <option value={5}>5 Applications (Recommended)</option>
                      <option value={10}>10 Applications</option>
                      <option value={20}>20 Applications</option>
                    </select>
                    <span className="input-hint">Post closes automatically when limit reached</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Amount */}
          {step === 3 && (
            <div className="step-amount">
              <h2>Set your offered pay</h2>
              <p className="text-secondary text-sm">How much will you pay for this work?</p>

              <div className="amount-input-group mt-6">
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
                    value={form.amount}
                    onChange={e => updateForm('amount', e.target.value)}
                    min={0}
                    autoFocus
                  />
                </div>
                <span className="amount-hint">Payment will be made directly to the worker offline</span>
              </div>
            </div>
          )}

          {/* Step 4: Contact Info */}
          {step === 4 && (
            <div className="step-contact">
              <h2>Publisher Contact Details</h2>
              <p className="text-secondary text-sm">Provide your contact info so workers can reach out after booking request approval</p>

              <div className="input-group mt-4">
                <label className="input-label">Mobile Phone Number</label>
                <div className="input-icon-wrapper">
                  <Phone size={18} className="input-icon" />
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="+91 98765 43210"
                    value={form.contactPhone}
                    onChange={e => updateForm('contactPhone', e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div className="input-icon-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
                    value={form.contactEmail}
                    onChange={e => updateForm('contactEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="contact-methods-box glass-card mt-4">
                <label className="input-label">Preferred Contact Methods</label>
                <div className="contact-checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.whatsappPref}
                      onChange={e => updateForm('whatsappPref', e.target.checked)}
                    />
                    <span>Allow WhatsApp Chat</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.callPref}
                      onChange={e => updateForm('callPref', e.target.checked)}
                    />
                    <span>Allow Phone Calls</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="step-review">
              <h2>Review & Publish</h2>
              <p className="text-secondary text-sm">Make sure everything looks good before publishing</p>

              <div className="review-card glass-card mt-4">
                <div className="review-row">
                  <Tag size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Category</span>
                    <span className="review-value">💼 {categoryDisplayName}</span>
                  </div>
                </div>

                <div className="review-row">
                  <FileText size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Title</span>
                    <span className="review-value">{form.title}</span>
                  </div>
                </div>

                <div className="review-row">
                  <FileText size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Description & Files</span>
                    <span className="review-value review-desc">{form.description}</span>
                    {form.attachments && form.attachments.length > 0 && (
                      <span className="text-xs text-accent mt-1 block">
                        📎 {form.attachments.length} file(s) attached
                      </span>
                    )}
                  </div>
                </div>

                <div className="review-row">
                  <Calendar size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Timing & Expiry</span>
                    <span className="review-value">
                      {form.date} • Expires: {form.expiryDate ? form.expiryDate.replace('T', ' ') : 'N/A'} • Max {form.maxApplications} apps
                    </span>
                  </div>
                </div>

                <div className="review-row">
                  <DollarSign size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Amount</span>
                    <span className="review-value review-amount">
                      {formatAmount(Number(form.amount), form.currencySymbol)}
                    </span>
                  </div>
                </div>

                <div className="review-row">
                  <Phone size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Contact Details</span>
                    <span className="review-value">{form.contactPhone} ({form.contactEmail})</span>
                  </div>
                </div>

                <div className="review-row">
                  <MapPin size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Location</span>
                    <span className="review-value">{form.location?.address || location?.address || 'Current location'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="post-actions">
          {step > 0 && (
            <button className="btn btn-outline" onClick={() => setStep(step - 1)}>
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
              style={{ marginLeft: 'auto' }}
            >
              🚀 Publish Work Requirement
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostGig;
