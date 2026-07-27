import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Clock, Calendar, IndianRupee, Phone, CheckCircle, 
  AlertTriangle, Mail, MessageSquare, Hourglass, Users, Paperclip, Image as ImageIcon,
  Send, ExternalLink, ShieldCheck, Check, X
} from 'lucide-react';
import { useGigs } from '../../context/GigContext';
import { useAuth } from '../../context/AuthContext';
import { getCategoryById } from '../../data/categories';
import { formatDate, formatTime, formatDistance, getInitials } from '../../utils/helpers';
import ChatDrawer from '../../components/Chat/ChatDrawer';
import './GigDetail.css';

const GigDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    getGigById, getUserById, applyForGig, respondToRequest, 
    sendChatMessage, completeGig, cancelGig, isGigExpired 
  } = useGigs();
  const { user } = useAuth();

  const [requestNote, setRequestNote] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [activeChatRequest, setActiveChatRequest] = useState(null); // active request object for ChatDrawer

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

  // Worker request check
  const myRequest = user ? (gig.requests || []).find(r => r.workerId === user.id) : null;
  const expired = isGigExpired(gig);

  const handleSendRequest = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    applyForGig(gig.id, requestNote);
    setShowApplyModal(false);
    setRequestNote('');
  };

  const handleSendMessage = (text) => {
    if (!activeChatRequest) return;
    sendChatMessage(gig.id, activeChatRequest.id, text);
  };

  // Keep active chat request sync with state
  const updatedActiveChatReq = activeChatRequest 
    ? (gig.requests || []).find(r => r.id === activeChatRequest.id) || activeChatRequest
    : null;

  const contact = gig.contactDetails || {
    phone: poster.phone || '+91 98765 43210',
    email: poster.email || 'publisher@wikwik.com',
    whatsapp: true,
    allowCall: true,
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
            <span>{category?.name || gig.category}</span>
          </div>
        </div>

        {/* Header Section */}
        <section className="detail-header glass-card animate-fade-in-up">
          <div className="detail-status-banner">
            {gig.status === 'active' && !expired && <span className="badge badge-success">Open for Requests</span>}
            {gig.status === 'active' && expired && <span className="badge badge-error">Expired / Closed</span>}
            {gig.status === 'booked' && <span className="badge badge-warning">Booked</span>}
            {gig.status === 'completed' && <span className="badge badge-primary">Completed</span>}
            {gig.status === 'cancelled' && <span className="badge badge-error">Cancelled</span>}
          </div>

          <h1 className="detail-title">{gig.title}</h1>

          {/* Amount Section */}
          <div className="detail-amount-tag">
            <span className="amount-label">Offered Pay:</span>
            <div className="amount-value">
              <IndianRupee size={22} />
              <span>{gig.amount.toLocaleString('en-IN')}</span>
            </div>
            <span className="pay-note">(Direct offline payment)</span>
          </div>
        </section>

        {/* 2. Publisher Contact Details Section (Added right after Amount Section) */}
        <section className="detail-section publisher-contact-card glass-card animate-fade-in-up">
          <h3><Phone size={18} className="text-accent" /> Publisher Contact Details</h3>
          <p className="text-xs text-secondary mb-3">
            Contact information provided by the post publisher:
          </p>

          <div className="publisher-contact-grid">
            <div className="contact-item">
              <Phone size={16} className="contact-icon text-accent" />
              <div>
                <span className="contact-label">Mobile Phone</span>
                <span className="contact-val">{contact.phone || 'Provided upon booking'}</span>
              </div>
            </div>

            <div className="contact-item">
              <Mail size={16} className="contact-icon text-accent" />
              <div>
                <span className="contact-label">Email Address</span>
                <span className="contact-val">{contact.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="contact-actions-bar mt-3">
            {contact.allowCall && contact.phone && (
              <a href={`tel:${contact.phone}`} className="btn btn-outline btn-sm">
                <Phone size={14} /> Call Publisher
              </a>
            )}

            {contact.whatsapp && contact.phone && (
              <a 
                href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-whatsapp btn-sm"
              >
                <MessageSquare size={14} /> WhatsApp Chat
              </a>
            )}
          </div>
        </section>

        {/* Quick Info Grid (Timing, Location, Expiry & Max Applications) */}
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

          {/* 4. Expiry & Applications Stats Card */}
          <div className="info-card glass-card highlight-card">
            <Hourglass size={18} className="info-icon text-warning" />
            <div>
              <span className="info-title">Post Expiry & Limit</span>
              <span className="info-val">
                {gig.expiryDate ? `Expires: ${gig.expiryDate.replace('T', ' ')}` : 'No Expiry'} • {(gig.requests || []).length} / {gig.maxApplications || 5} Applications
              </span>
            </div>
          </div>
        </section>

        {/* 1. Description & Published Images/Documents Section */}
        <section className="detail-section glass-card animate-fade-in-up">
          <h3>Requirement Description</h3>
          <p className="detail-desc">{gig.description}</p>

          {/* Published Attachments Gallery / Documents */}
          {gig.attachments && gig.attachments.length > 0 && (
            <div className="published-attachments-container mt-4">
              <h4 className="attachments-title">
                <Paperclip size={15} /> Published Attachments & Documents ({gig.attachments.length})
              </h4>
              <div className="attachments-grid mt-2">
                {gig.attachments.map(att => (
                  <div key={att.id} className="attachment-card">
                    {att.type === 'image' || att.url?.startsWith('data:image') ? (
                      <div className="att-image-preview">
                        <img src={att.url} alt={att.name} />
                        <span className="att-type-tag"><ImageIcon size={12} /> Image</span>
                      </div>
                    ) : (
                      <div className="att-doc-preview">
                        <Paperclip size={24} className="text-primary mb-1" />
                        <span className="att-doc-name">{att.name}</span>
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="att-download-link">
                          <ExternalLink size={12} /> View Document
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Poster Profile Info */}
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
                <span>⭐ {poster.rating || '4.8'}</span>
                <span>• {poster.gigsPosted || 1} Work Posts</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Received Applications Section (For Publisher / Job Poster) */}
        {isOwner && (
          <section className="detail-section applicants-section glass-card animate-fade-in-up">
            <h3><Users size={18} className="text-accent" /> Received Applications ({(gig.requests || []).length})</h3>
            <p className="text-xs text-secondary mb-3">
              Review worker application requests and accept/approve a worker:
            </p>

            {(!gig.requests || gig.requests.length === 0) ? (
              <div className="empty-requests-box">
                <Users size={32} className="text-tertiary mb-2" />
                <p className="text-sm text-secondary">No worker requests received yet.</p>
              </div>
            ) : (
              <div className="requests-list">
                {gig.requests.map(req => (
                  <div key={req.id} className={`request-item-card ${req.status}`}>
                    <div className="req-header">
                      <div className="req-worker-info">
                        <div className="avatar avatar-md">{getInitials(req.workerName)}</div>
                        <div>
                          <h4 className="req-worker-name">{req.workerName}</h4>
                          <span className={`status-pill ${req.status}`}>
                            {req.status === 'pending' && '⏳ Pending Approval'}
                            {req.status === 'approved' && '✅ Approved Worker'}
                            {req.status === 'rejected' && '❌ Rejected'}
                          </span>
                        </div>
                      </div>

                      {/* 5. In-App Direct Chat Button for Publisher */}
                      <button
                        className="btn btn-outline btn-sm chat-open-btn"
                        onClick={() => setActiveChatRequest(req)}
                      >
                        <MessageSquare size={14} />
                        Direct Chat ({req.messages?.length || 0})
                      </button>
                    </div>

                    <p className="req-message">"{req.message}"</p>

                    {/* Action Buttons for Publisher */}
                    {req.status === 'pending' && gig.status === 'active' && (
                      <div className="req-actions mt-3">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => respondToRequest(gig.id, req.id, 'approved')}
                        >
                          <Check size={14} /> Approve Booking
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => respondToRequest(gig.id, req.id, 'rejected')}
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3 & 5. Worker Application Status Card (For Worker) */}
        {!isOwner && myRequest && (
          <section className="detail-section my-request-card glass-card animate-fade-in-up">
            <h3><ShieldCheck size={18} className="text-success" /> Your Booking Request</h3>
            <div className="my-req-status-banner">
              <span className={`status-badge-lg ${myRequest.status}`}>
                {myRequest.status === 'pending' && '⏳ Request Sent - Waiting for Publisher Approval'}
                {myRequest.status === 'approved' && '🎉 Application Approved! You are selected for this work.'}
                {myRequest.status === 'rejected' && '❌ Application Not Selected'}
              </span>
            </div>

            <p className="my-req-note">Your Note: "{myRequest.message}"</p>

            {/* Direct Chat with Publisher */}
            <div className="my-req-chat-bar mt-3">
              <button
                className="btn btn-primary btn-block"
                onClick={() => setActiveChatRequest(myRequest)}
              >
                <MessageSquare size={18} />
                Direct Chat with Publisher ({myRequest.messages?.length || 0} messages)
              </button>
              <p className="text-xs text-tertiary text-center mt-1">
                🔒 You can safely discuss work details in chat without sharing your phone number
              </p>
            </div>
          </section>
        )}

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="apply-modal-overlay animate-fade-in">
            <div className="apply-modal glass-card animate-fade-in-up">
              <h3>Send Work Request</h3>
              <p className="text-xs text-secondary mb-3">
                Send a booking request note to the publisher. The publisher will review and approve your request.
              </p>

              <form onSubmit={handleSendRequest}>
                <textarea
                  className="input-field"
                  placeholder="Introduce yourself or share relevant experience..."
                  value={requestNote}
                  onChange={e => setRequestNote(e.target.value)}
                  rows={4}
                  autoFocus
                />
                <div className="modal-actions mt-4">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowApplyModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Send size={16} /> Send Booking Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="detail-action-bar">
          {gig.status === 'active' && !isOwner && !myRequest && !expired && (
            <button className="btn btn-primary btn-lg btn-block" onClick={() => setShowApplyModal(true)}>
              <CheckCircle size={20} />
              Send Booking Request
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

        {/* Direct In-App Chat Modal/Drawer */}
        {updatedActiveChatReq && (
          <ChatDrawer
            isOpen={!!activeChatRequest}
            onClose={() => setActiveChatRequest(null)}
            gigTitle={gig.title}
            currentUserId={user?.id || 'guest'}
            otherUser={
              isOwner 
                ? { name: updatedActiveChatReq.workerName }
                : { name: poster.name }
            }
            messages={updatedActiveChatReq.messages || []}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
};

export default GigDetail;
