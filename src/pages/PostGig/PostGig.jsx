import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Check, MapPin, Calendar, Clock, IndianRupee, 
  FileText, Tag, Edit3, Image as ImageIcon, Paperclip, X, Phone, Mail, 
  MessageSquare, Hourglass, Users 
} from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { useGigs } from '../../context/GigContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { formatAmount } from '../../utils/helpers';
import './PostGig.css';

const STEPS = ['Category', 'Details & Files', 'Schedule & Expiry', 'Amount', 'Contact Info', 'Review'];

const PostGig = () => {
  const navigate = useNavigate();
  const { postGig, showToast } = useGigs();
  const { user, isAuthenticated } = useAuth();
  const { location } = useLocation();

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
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    whatsappPref: true,
    callPref: true,
    location: { ...location },
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
      case 4: return form.contactPhone.length >= 10 && form.contactEmail.includes('@');
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
      date: dateTime,
      duration: form.duration,
      location: form.location,
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
    : (selectedCategoryObj?.name || form.category);

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
                  return (
                    <button
                      key={cat.id}
                      className={`category-select-item ${cat.cssClass} ${form.category === cat.id ? 'selected' : ''}`}
                      onClick={() => updateForm('category', cat.id)}
                    >
                      <Icon size={24} />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>

              {form.category === 'other' && (
                <div className="input-group mt-6 animate-fade-in-up">
                  <label className="input-label">Specify Custom Work Category</label>
                  <div className="input-icon-wrapper">
                    <Edit3 size={18} className="input-icon" />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Car Washing, Painting, Tailoring..."
                      value={form.customCategory}
                      onChange={e => updateForm('customCategory', e.target.value)}
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
                <div className="input-icon-wrapper">
                  <FileText size={18} className="input-icon" />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Driver needed for airport drop today"
                    value={form.title}
                    onChange={e => updateForm('title', e.target.value)}
                    maxLength={100}
                  />
                </div>
                <span className="input-hint">{form.title.length}/100</span>
              </div>

              <div className="input-group mt-4">
                <label className="input-label">Detailed Description</label>
                <textarea
                  className="input-field"
                  placeholder="Describe your requirement in detail..."
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  rows={4}
                  maxLength={600}
                />
                <span className="input-hint">{form.description.length}/600</span>
              </div>

              {/* Attachments Section */}
              <div className="attachments-upload-section mt-6">
                <label className="input-label">Publish Images & Documents (Optional)</label>
                <div className="upload-buttons-row">
                  <label className="btn btn-outline btn-sm upload-btn">
                    <ImageIcon size={16} /> Add Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'image')}
                      hidden
                      multiple
                    />
                  </label>

                  <label className="btn btn-outline btn-sm upload-btn">
                    <Paperclip size={16} /> Add Document
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={e => handleFileUpload(e, 'document')}
                      hidden
                      multiple
                    />
                  </label>
                </div>

                {/* Attachments List */}
                {form.attachments.length > 0 && (
                  <div className="attached-files-list mt-3">
                    {form.attachments.map(att => (
                      <div key={att.id} className="attached-file-chip">
                        {att.type === 'image' ? <ImageIcon size={14} className="text-accent" /> : <Paperclip size={14} className="text-primary" />}
                        <span className="file-name">{att.name}</span>
                        <button type="button" className="remove-att-btn" onClick={() => removeAttachment(att.id)}>
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

              <div className="input-group mt-4">
                <label className="input-label">Duration</label>
                <div className="input-icon-wrapper">
                  <Clock size={18} className="input-icon" />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 3 hours, Full day, 2 days"
                    value={form.duration}
                    onChange={e => updateForm('duration', e.target.value)}
                  />
                </div>
              </div>

              <div className="expiry-config-card glass-card mt-6">
                <h3><Hourglass size={16} className="text-warning" /> Post Expiry & Application Limits</h3>
                
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
                    <label className="input-label"><Users size={14} className="inline-icon" /> Max Applications Limit</label>
                    <select
                      className="input-field"
                      value={form.maxApplications}
                      onChange={e => updateForm('maxApplications', e.target.value)}
                    >
                      <option value={1}>1 Application (Close instantly on 1 request)</option>
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

              <div className="amount-input-wrapper mt-6">
                <span className="amount-currency">₹</span>
                <input
                  type="number"
                  className="amount-input"
                  placeholder="0"
                  value={form.amount}
                  onChange={e => updateForm('amount', e.target.value)}
                  min={0}
                />
              </div>
              <p className="text-center text-xs text-tertiary mt-2">
                Payment will be made directly to the worker offline
              </p>
            </div>
          )}

          {/* Step 4: Contact Details (New Section after Amount) */}
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
                    placeholder="e.g. +91 98765 43210"
                    value={form.contactPhone}
                    onChange={e => updateForm('contactPhone', e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group mt-4">
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

              <div className="contact-preferences-card glass-card mt-6">
                <span className="input-label mb-2 block">Preferred Contact Methods</span>
                <div className="checkbox-row">
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
                    {form.attachments.length > 0 && (
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
                    <span className="review-value">{form.date} • Expires: {form.expiryDate?.replace('T', ' ')} • Max {form.maxApplications} apps</span>
                  </div>
                </div>

                <div className="review-row">
                  <IndianRupee size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">Amount</span>
                    <span className="review-value review-amount">{formatAmount(Number(form.amount))}</span>
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
                    <span className="review-value">{form.location.address || 'Current location'}</span>
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
