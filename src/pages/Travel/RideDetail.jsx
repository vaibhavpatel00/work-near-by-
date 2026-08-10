import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Clock, Calendar, Car, Bike, Users, Phone, 
  CheckCircle, AlertTriangle, Mail, MessageSquare, Send, 
  ShieldCheck, Check, X, Trash2, Wind, Package, Music, Cigarette,
  ArrowRight, Loader2, Crown, UserCheck, Hourglass
} from 'lucide-react';
import { useRides, isRideOwner, getPassengerBooking } from '../../context/RideContext';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatTime, formatDistance, formatAmount, getInitials } from '../../utils/helpers';
import ChatDrawer from '../../components/Chat/ChatDrawer';
import './RideDetail.css';

const RideDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    getRideById, bookSeat, respondToPassenger, 
    sendRideChatMessage, completeRide, cancelRide, deleteRide 
  } = useRides();
  const { user } = useAuth();

  const [requestNote, setRequestNote] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeChatRequest, setActiveChatRequest] = useState(null);

  const ride = getRideById(id);

  if (!ride) {
    return (
      <div className="page-content">
        <div className="detail-error animate-fade-in">
          <h2>Ride Not Found</h2>
          <p className="text-secondary">This ride does not exist or has been removed.</p>
          <Link to="/travel" className="btn btn-primary mt-4">Back to Travel</Link>
        </div>
      </div>
    );
  }

  const isBike = ride.vehicleType === 'bike';
  const VehicleIcon = isBike ? Bike : Car;

  // Strict Owner vs Passenger Determination
  const isOwner = isRideOwner(ride, user);
  const myBooking = getPassengerBooking(ride, user);

  const approvedCount = (ride.passengers || []).filter(p => p.status === 'approved').length;
  const isFull = approvedCount >= ride.seatsAvailable;

  const handleBookSeat = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (isBooking) return;
    setIsBooking(true);

    try {
      await bookSeat(ride.id, requestNote);
      setShowBookModal(false);
      setRequestNote('');
    } catch (err) {
      console.error('Booking error:', err);
    } finally {
      setIsBooking(false);
    }
  };

  const handleSendMessage = (text) => {
    if (!activeChatRequest) return;
    sendRideChatMessage(ride.id, activeChatRequest.id, text);
  };

  const handleDeleteRide = () => {
    deleteRide(ride.id);
    navigate('/travel');
  };

  // Keep active chat request in sync
  const updatedActiveChatReq = activeChatRequest 
    ? (ride.passengers || []).find(p => p.id === activeChatRequest.id) || activeChatRequest
    : null;

  const prefs = ride.preferences || {};

  return (
    <div className="page-content">
      <div className="ride-detail-page">
        {/* Top Bar */}
        <div className="detail-topbar">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Back
          </button>
          <div className="topbar-right-actions">
            {isOwner && (
              <button 
                className="btn btn-ghost btn-sm text-error" 
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 size={16} /> Delete Ride
              </button>
            )}
            <div className={`ride-type-badge ${ride.vehicleType}`}>
              <VehicleIcon size={14} />
              <span>{isBike ? 'Bike Ride' : 'Car Ride'}</span>
            </div>
          </div>
        </div>

        {/* Owner Dashboard Banner */}
        {isOwner && (
          <div className="owner-role-banner animate-fade-in">
            <div className="owner-banner-content">
              <Crown size={20} className="owner-crown-icon" />
              <div>
                <strong>👑 You are the Owner of this Ride</strong>
                <p>Manage passenger bookings, approve applicants, and chat with riders.</p>
              </div>
            </div>
          </div>
        )}

        {/* Route Header */}
        <section className="ride-route-header glass-card animate-fade-in-up">
          <div className="ride-status-banner">
            {ride.status === 'active' && !isFull && <span className="badge badge-success">Available</span>}
            {ride.status === 'active' && isFull && <span className="badge badge-warning">Full</span>}
            {ride.status === 'full' && <span className="badge badge-warning">All Seats Booked</span>}
            {ride.status === 'completed' && <span className="badge badge-primary">Completed</span>}
            {ride.status === 'cancelled' && <span className="badge badge-error">Cancelled</span>}
          </div>

          <div className="ride-route-visual">
            <div className="route-point">
              <div className="route-circle origin"></div>
              <div className="route-location">
                <span className="route-label">From</span>
                <h3>{ride.origin?.address || 'Origin'}</h3>
              </div>
            </div>
            <div className="route-journey-line">
              <div className="journey-line-dashed"></div>
              <ArrowRight size={16} className="journey-arrow" />
            </div>
            <div className="route-point">
              <div className="route-circle destination"></div>
              <div className="route-location">
                <span className="route-label">To</span>
                <h3>{ride.destination?.address || 'Destination'}</h3>
              </div>
            </div>
          </div>

          <div className="ride-price-tag">
            <span className="price-label">Price per seat:</span>
            <div className="price-value">
              <span>{formatAmount(ride.pricePerSeat, ride.currency || '₹')}</span>
            </div>
          </div>
        </section>

        {/* Quick Info Grid */}
        <section className="detail-info-grid stagger-children">
          <div className="info-card glass-card">
            <Calendar size={18} className="info-icon text-accent" />
            <div>
              <span className="info-title">Departure</span>
              <span className="info-val">{formatDate(ride.departureDate)} at {formatTime(ride.departureDate)}</span>
            </div>
          </div>

          <div className="info-card glass-card">
            <Users size={18} className="info-icon text-accent" />
            <div>
              <span className="info-title">Seats</span>
              <span className="info-val">{approvedCount}/{ride.seatsAvailable} booked</span>
            </div>
          </div>

          <div className="info-card glass-card">
            <VehicleIcon size={18} className="info-icon text-accent" />
            <div>
              <span className="info-title">Vehicle</span>
              <span className="info-val">{isBike ? 'Motorcycle / Bike' : 'Car'}</span>
            </div>
          </div>

          {ride.distanceToOrigin !== undefined && (
            <div className="info-card glass-card">
              <MapPin size={18} className="info-icon text-accent" />
              <div>
                <span className="info-title">Origin Distance</span>
                <span className="info-val">{formatDistance(ride.distanceToOrigin)} from you</span>
              </div>
            </div>
          )}
        </section>

        {/* Preferences */}
        {ride.vehicleType === 'car' && (
          <section className="detail-section glass-card animate-fade-in-up">
            <h3>Ride Preferences</h3>
            <div className="prefs-list">
              <div className={`pref-item ${prefs.ac ? 'active' : ''}`}>
                <Wind size={16} />
                <span>AC {prefs.ac ? '✓' : '✗'}</span>
              </div>
              <div className={`pref-item ${prefs.luggage ? 'active' : ''}`}>
                <Package size={16} />
                <span>Luggage {prefs.luggage ? '✓' : '✗'}</span>
              </div>
              <div className={`pref-item ${prefs.music ? 'active' : ''}`}>
                <Music size={16} />
                <span>Music {prefs.music ? '✓' : '✗'}</span>
              </div>
              <div className={`pref-item ${prefs.smoking ? 'active' : ''}`}>
                <Cigarette size={16} />
                <span>Smoking {prefs.smoking ? '✓' : '✗'}</span>
              </div>
            </div>
          </section>
        )}

        {/* Description */}
        {ride.description && (
          <section className="detail-section glass-card animate-fade-in-up">
            <h3>Ride Notes</h3>
            <p className="detail-desc">{ride.description}</p>
          </section>
        )}

        {/* Driver / Owner Info */}
        <section className="detail-section glass-card animate-fade-in-up">
          <h3>Ride Owner & Driver</h3>
          <div className="poster-profile">
            <div className="avatar avatar-lg">
              {getInitials(ride.driverName)}
            </div>
            <div className="poster-details">
              <h4>{ride.driverName}</h4>
              {ride.ownerEmail && (
                <p className="text-xs text-secondary mb-1">📧 {ride.ownerEmail}</p>
              )}
              {ride.driverPhone && (
                <div className="driver-contact-actions">
                  <a href={`tel:${ride.driverPhone}`} className="btn btn-outline btn-sm">
                    <Phone size={14} /> Call
                  </a>
                  <a 
                    href={`https://wa.me/${ride.driverPhone.replace(/[^0-9]/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-outline btn-sm"
                  >
                    <MessageSquare size={14} /> WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CUSTOMER VIEW: Booking Status Card */}
        {!isOwner && myBooking && (
          <section className="detail-section my-request-card glass-card animate-fade-in-up">
            <div className="my-req-header">
              <ShieldCheck size={20} className="text-success" />
              <h3>Your Booking Status</h3>
            </div>

            <div className="my-req-status-banner mt-3">
              <span className={`status-badge-lg ${myBooking.status}`}>
                {myBooking.status === 'pending' && '⏳ Waiting for Owner Approval'}
                {myBooking.status === 'approved' && '🎉 Seat Confirmed & Booked!'}
                {myBooking.status === 'rejected' && '❌ Request Not Accepted'}
              </span>
            </div>

            <p className="booking-status-helper text-xs text-secondary mt-2">
              {myBooking.status === 'pending' && `Your seat request has been sent to ${ride.driverName}. You will be notified once approved.`}
              {myBooking.status === 'approved' && `The owner has confirmed your seat. You can chat with ${ride.driverName} to arrange pickup.`}
              {myBooking.status === 'rejected' && `The owner was unable to accept this booking request.`}
            </p>

            {myBooking.message && (
              <div className="booking-sent-note mt-3">
                <span className="note-label">Your message to owner:</span>
                <p className="note-text">"{myBooking.message}"</p>
              </div>
            )}

            <div className="my-req-chat-bar mt-4">
              <button
                className="btn btn-primary btn-block"
                onClick={() => setActiveChatRequest(myBooking)}
              >
                <MessageSquare size={18} />
                Chat with Owner ({ride.driverName}) {myBooking.messages?.length > 0 && `(${myBooking.messages.length})`}
              </button>
            </div>
          </section>
        )}

        {/* OWNER VIEW: Passenger Requests List */}
        {isOwner && (
          <section className="detail-section applicants-section glass-card animate-fade-in-up">
            <div className="section-header-row">
              <h3>
                <Users size={18} className="text-accent" /> 
                Passenger Applicants & Requests ({(ride.passengers || []).length})
              </h3>
              <span className="badge badge-info">{approvedCount}/{ride.seatsAvailable} seats filled</span>
            </div>

            {(!ride.passengers || ride.passengers.length === 0) ? (
              <div className="empty-requests-box">
                <Users size={32} className="text-tertiary mb-2" />
                <p className="text-sm text-secondary">No passenger booking requests yet.</p>
                <p className="text-xs text-tertiary">When customers search and book a seat, their requests will appear here for your approval.</p>
              </div>
            ) : (
              <div className="requests-list">
                {ride.passengers.map(req => (
                  <div key={req.id} className={`request-item-card ${req.status}`}>
                    <div className="req-header">
                      <div className="req-worker-info">
                        <div className="avatar avatar-md">{getInitials(req.passengerName)}</div>
                        <div>
                          <h4 className="req-worker-name">{req.passengerName}</h4>
                          {req.passengerEmail && (
                            <span className="text-xs text-tertiary" style={{ display: 'block' }}>
                              📧 {req.passengerEmail}
                            </span>
                          )}
                          {req.passengerPhone && (
                            <span className="text-xs text-secondary" style={{ display: 'block' }}>
                              📞 {req.passengerPhone}
                            </span>
                          )}
                          <span className={`status-pill ${req.status}`}>
                            {req.status === 'pending' && '⏳ Waiting Your Approval'}
                            {req.status === 'approved' && '✅ Approved & Confirmed'}
                            {req.status === 'rejected' && '❌ Rejected'}
                          </span>
                        </div>
                      </div>

                      <button
                        className="btn btn-outline btn-sm chat-open-btn"
                        onClick={() => setActiveChatRequest(req)}
                      >
                        <MessageSquare size={14} />
                        Chat ({req.messages?.length || 0})
                      </button>
                    </div>

                    {req.message && <p className="req-message">"{req.message}"</p>}

                    {req.status === 'pending' && ride.status === 'active' && (
                      <div className="req-actions mt-3">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => respondToPassenger(ride.id, req.id, 'approved')}
                        >
                          <Check size={14} /> Approve Seat
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => respondToPassenger(ride.id, req.id, 'rejected')}
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

        {/* Customer Book Modal */}
        {showBookModal && (
          <div className="apply-modal-overlay animate-fade-in">
            <div className="apply-modal glass-card animate-fade-in-up">
              <h3>Book a Seat</h3>
              <p className="text-xs text-secondary mb-3">
                Send a booking request to {ride.driverName} ({ride.ownerEmail || 'Owner'}). You will be notified once they approve.
              </p>

              <form onSubmit={handleBookSeat}>
                <textarea
                  className="input-field"
                  placeholder="Introduce yourself, mention your pickup location..."
                  value={requestNote}
                  onChange={e => setRequestNote(e.target.value)}
                  rows={4}
                  autoFocus
                />
                <div className="modal-actions mt-4">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowBookModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isBooking}>
                    {isBooking ? (
                      <>
                        <Loader2 size={16} className="spin" /> Sending Request...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Send Booking Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="apply-modal-overlay animate-fade-in">
            <div className="apply-modal glass-card animate-fade-in-up">
              <h3 className="text-error"><Trash2 size={20} className="inline-icon" /> Delete Ride?</h3>
              <p className="text-xs text-secondary mt-2 mb-4">
                Are you sure you want to permanently delete this ride?
              </p>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-outline text-error" onClick={handleDeleteRide}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="detail-action-bar">
          {/* Non-owner customer without booking */}
          {ride.status === 'active' && !isOwner && !myBooking && !isFull && (
            <button className="btn btn-primary btn-lg btn-block" onClick={() => setShowBookModal(true)}>
              <CheckCircle size={20} />
              Book a Seat ({formatAmount(ride.pricePerSeat, ride.currency || '₹')})
            </button>
          )}

          {/* Full ride for non-booked customer */}
          {!isOwner && !myBooking && isFull && (
            <button className="btn btn-outline btn-lg btn-block" disabled>
              All Seats Booked
            </button>
          )}

          {/* Owner controls */}
          {isOwner && (
            <div className="owner-action-buttons">
              {ride.status === 'active' && (
                <button className="btn btn-outline btn-block text-error" onClick={() => cancelRide(ride.id)}>
                  <AlertTriangle size={18} />
                  Cancel Ride
                </button>
              )}
              {(ride.status === 'active' || ride.status === 'full') && (
                <button className="btn btn-accent btn-lg btn-block mt-2" onClick={() => completeRide(ride.id)}>
                  <CheckCircle size={20} />
                  Mark as Completed
                </button>
              )}
            </div>
          )}

          {ride.status === 'completed' && (
            <div className="completed-badge-bar">
              <CheckCircle size={20} className="text-success" />
              <span>This ride has been completed</span>
            </div>
          )}
        </div>

        {/* Chat Drawer */}
        {updatedActiveChatReq && (
          <ChatDrawer
            isOpen={Boolean(activeChatRequest)}
            onClose={() => setActiveChatRequest(null)}
            gigTitle={`${ride.origin?.address} → ${ride.destination?.address}`}
            currentUserId={user?.id || 'guest'}
            otherUser={
              isOwner 
                ? { name: updatedActiveChatReq.passengerName }
                : { name: ride.driverName }
            }
            messages={updatedActiveChatReq.messages || []}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
};

export default RideDetail;
