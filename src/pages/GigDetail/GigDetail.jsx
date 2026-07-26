import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Calendar, IndianRupee, Phone, CheckCircle, AlertTriangle } from 'lucide-react';
import { useGigs } from '../../context/GigContext';
import { useAuth } from '../../context/AuthContext';
import { getCategoryById } from '../../data/categories';
import { formatDate, formatTime, formatDistance, getInitials } from '../../utils/helpers';
import './GigDetail.css';

const GigDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getGigById, getUserById, acceptGig, completeGig, cancelGig } = useGigs();
  const { user } = useAuth();

  const gig = getGigById(id);

  if (!gig) {
    return (
      <div className="page-content">
        <div className="detail-error animate-fade-in">
          <h2>Work Post Not Found</h2>
          <p className="text-secondary">The requested work requirement does not exist or has been removed.</p>
          <Link to="/" className="btn btn-primary mt-4">Back to Home</Link>
        </div>
      </div>
    );
  }

  const category = getCategoryById(gig.category);
  const CategoryIcon = category?.icon;
  const poster = getUserById(gig.postedBy);
  const acceptedWorker = gig.acceptedBy ? getUserById(gig.acceptedBy) : null;

  const isOwner = user?.id === gig.postedBy;
  const isBookedByMe = user?.id === gig.acceptedBy;

  const handleAccept = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    acceptGig(gig.id);
  };

  return (
    <div className="page-content">
      <div className="gig-detail-page">
        {/* Top Bar */}
        <div className="detail-topbar">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Back
          </button>
          <div className={`detail-category-badge ${category?.cssClass}`}>
            {CategoryIcon && <CategoryIcon size={14} />}
            <span>{category?.name}</span>
          </div>
        </div>

        {/* Header Section */}
        <section className="detail-header glass-card animate-fade-in-up">
          <div className="detail-status-banner">
            {gig.status === 'active' && <span className="badge badge-success">Open for Booking</span>}
            {gig.status === 'booked' && <span className="badge badge-warning">Booked</span>}
            {gig.status === 'completed' && <span className="badge badge-primary">Completed</span>}
            {gig.status === 'cancelled' && <span className="badge badge-error">Cancelled</span>}
          </div>

          <h1 className="detail-title">{gig.title}</h1>

          <div className="detail-amount-tag">
            <span className="amount-label">Offered Pay:</span>
            <div className="amount-value">
              <IndianRupee size={20} />
              <span>{gig.amount.toLocaleString('en-IN')}</span>
            </div>
            <span className="pay-note">(Offline direct payment)</span>
          </div>
        </section>

        {/* Quick Info Grid */}
        <section className="detail-info-grid stagger-children">
          <div className="info-card glass-card">
            <Calendar size={18} className="info-icon text-accent" />
            <div>
              <span className="info-title">Date & Time</span>
              <span className="info-val">{formatDate(gig.date)} at {formatTime(gig.date)}</span>
            </div>
          </div>

          <div className="info-card glass-card">
            <Clock size={18} className="info-icon text-accent" />
            <div>
              <span className="info-title">Duration</span>
              <span className="info-val">{gig.duration}</span>
            </div>
          </div>

          <div className="info-card glass-card">
            <MapPin size={18} className="info-icon text-accent" />
            <div>
              <span className="info-title">Location</span>
              <span className="info-val">
                {gig.location.address} ({gig.distance !== undefined ? formatDistance(gig.distance) : ''})
              </span>
            </div>
          </div>
        </section>

        {/* Description Section */}
        <section className="detail-section glass-card animate-fade-in-up">
          <h3>Requirement Description</h3>
          <p className="detail-desc">{gig.description}</p>
        </section>

        {/* Poster Info */}
        <section className="detail-section glass-card animate-fade-in-up">
          <h3>Posted By</h3>
          <div className="poster-profile">
            <div className="avatar avatar-lg">
              {getInitials(poster.name)}
            </div>
            <div className="poster-details">
              <h4>{poster.name}</h4>
              <p className="poster-bio">{poster.bio || 'Community Member'}</p>
              <div className="poster-stats">
                <span>⭐ {poster.rating || '4.5'}</span>
                <span>• {poster.gigsPosted || 1} Work Posts</span>
              </div>
            </div>
          </div>
        </section>

        {/* Contact / Action Area */}
        {(isOwner || isBookedByMe || gig.status === 'booked') && (
          <section className="detail-section contact-card glass-card animate-fade-in-up">
            <h3><Phone size={18} /> Contact Details</h3>
            {isOwner && acceptedWorker && (
              <div className="contact-row">
                <p>Accepted Worker: <strong>{acceptedWorker.name}</strong></p>
                <a href={`tel:${acceptedWorker.phone}`} className="btn btn-outline btn-sm">
                  Call {acceptedWorker.phone}
                </a>
              </div>
            )}
            {!isOwner && gig.status === 'booked' && (
              <div className="contact-row">
                <p>Poster Phone: <strong>{poster.phone}</strong></p>
                <a href={`tel:${poster.phone}`} className="btn btn-primary btn-sm">
                  Call Poster Now
                </a>
              </div>
            )}
          </section>
        )}

        {/* Footer Actions */}
        <div className="detail-action-bar">
          {gig.status === 'active' && !isOwner && (
            <button className="btn btn-primary btn-lg btn-block" onClick={handleAccept}>
              <CheckCircle size={20} />
              Accept Work & Contact Poster
            </button>
          )}

          {gig.status === 'active' && isOwner && (
            <button className="btn btn-outline btn-block text-error" onClick={() => cancelGig(gig.id)}>
              <AlertTriangle size={18} />
              Cancel Work Requirement
            </button>
          )}

          {gig.status === 'booked' && (isOwner || isBookedByMe) && (
            <button className="btn btn-accent btn-lg btn-block" onClick={() => completeGig(gig.id)}>
              <CheckCircle size={20} />
              Mark Work as Completed
            </button>
          )}

          {gig.status === 'completed' && (
            <div className="completed-badge-bar">
              <CheckCircle size={20} className="text-success" />
              <span>This work has been completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GigDetail;
