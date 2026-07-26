import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, MapPin, Calendar, Clock, IndianRupee, FileText, Tag, Edit3 } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { useGigs } from '../../context/GigContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { formatAmount } from '../../utils/helpers';
import './PostGig.css';

const STEPS = ['Category', 'Details', 'Schedule', 'Amount', 'Review'];

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
    date: '',
    time: '',
    duration: '',
    amount: '',
    location: { ...location },
  });

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        if (!form.category) return false;
        if (form.category === 'other') return form.customCategory.trim().length >= 2;
        return true;
      case 1: return form.title.length >= 5 && form.description.length >= 10;
      case 2: return !!form.date && !!form.duration;
      case 3: return form.amount > 0;
      case 4: return true;
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

              {/* Custom Work Input when Other is selected */}
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

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="step-details">
              <h2>Describe the work</h2>
              <p className="text-secondary text-sm">Help workers understand what you need</p>

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
                <label className="input-label">Description</label>
                <textarea
                  className="input-field"
                  placeholder="Describe your requirement in detail..."
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <span className="input-hint">{form.description.length}/500</span>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="step-schedule">
              <h2>When do you need it?</h2>
              <p className="text-secondary text-sm">Set the date, time, and duration</p>

              <div className="input-group mt-4">
                <label className="input-label">Date</label>
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

              <div className="input-group mt-4">
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

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="step-review">
              <h2>Review & Publish</h2>
              <p className="text-secondary text-sm">Make sure everything looks good</p>

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
                    <span className="review-label">Description</span>
                    <span className="review-value review-desc">{form.description}</span>
                  </div>
                </div>
                <div className="review-row">
                  <Calendar size={16} className="text-tertiary" />
                  <div>
                    <span className="review-label">When</span>
                    <span className="review-value">{form.date} {form.time && `at ${form.time}`} • {form.duration}</span>
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
              🚀 Publish Work
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostGig;
