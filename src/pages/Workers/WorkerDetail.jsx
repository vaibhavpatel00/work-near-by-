import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Phone, MessageSquare, MapPin, Clock, Star, 
  ShieldCheck, Wrench, Award, CheckCircle, Sparkles, Send, 
  Calendar, DollarSign, AlertCircle, Edit3
} from 'lucide-react';
import { useWorkers } from '../../context/WorkerContext';
import { useAuth } from '../../context/AuthContext';
import { getCategoryById } from '../../data/categories';
import { formatDistance, formatAmount, getInitials } from '../../utils/helpers';
import ChatDrawer from '../../components/Chat/ChatDrawer';
import './WorkerDetail.css';

const WorkerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getWorkerById, myWorkerProfile } = useWorkers();
  const { user } = useAuth();

  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'msg-welcome',
      senderId: 'worker',
      senderName: 'Worker',
      text: 'Hello! Thanks for reaching out. How can I help you with repairs or services today?',
      timestamp: new Date().toISOString(),
    }
  ]);

  const worker = getWorkerById(id);

  if (!worker) {
    return (
      <div className="page-content">
        <div className="detail-error animate-fade-in">
          <h2>Worker Profile Not Found</h2>
          <p className="text-secondary">This worker profile does not exist or has been removed.</p>
          <Link to="/explore" className="btn btn-primary mt-4">Browse Workers</Link>
        </div>
      </div>
    );
  }

  const category = getCategoryById(worker.profession);
  const CategoryIcon = category?.icon || Wrench;
  const isMe = user && (String(user.id) === String(worker.workerId) || (user.email && user.email.toLowerCase() === worker.workerEmail?.toLowerCase()));

  const rawPhone = (worker.phone || '').replace(/\D/g, '');
  const rawWhatsApp = (worker.whatsapp || worker.phone || '').replace(/\D/g, '');

  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      senderId: user?.id || 'guest',
      senderName: user?.name || 'Customer',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, newMsg]);
  };

  return (
    <div className="page-content">
      <div className="worker-detail-page">
        {/* Topbar */}
        <div className="worker-detail-topbar">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Back
          </button>
          {isMe && (
            <Link to="/register-worker" className="btn btn-outline btn-sm">
              <Edit3 size={14} /> Edit Profile
            </Link>
          )}
        </div>

        {/* Worker Header Card */}
        <div className="worker-profile-hero glass-card animate-fade-in-up">
          <div className="worker-hero-top">
            <div className="avatar avatar-xl">
              {getInitials(worker.name)}
            </div>
            <div className="worker-hero-info">
              <div className="worker-hero-title-row">
                <h2>{worker.name}</h2>
                <ShieldCheck size={20} className="text-primary" title="Verified Professional" />
              </div>

              <div className="worker-badge-pill">
                <CategoryIcon size={14} />
                <span>{worker.customProfession || category?.name || worker.profession}</span>
              </div>

              <div className="worker-rating-row mt-2">
                <div className="rating-tag">
                  <Star size={13} className="star-icon" />
                  <strong>{worker.rating || '4.9'}</strong>
                  <span>({worker.reviewsCount || 8} reviews)</span>
                </div>
                {worker.experience && (
                  <span className="experience-tag">
                    <Award size={13} /> {worker.experience}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Contact Buttons */}
          <div className="worker-hero-actions mt-4">
            {worker.phone && (
              <a href={`tel:${worker.phone}`} className="btn btn-primary btn-call">
                <Phone size={18} /> Call Worker
              </a>
            )}

            {(worker.whatsapp || worker.phone) && (
              <a 
                href={`https://wa.me/${rawWhatsApp}?text=${encodeURIComponent(`Hi ${worker.name}, I found your profile on Wikwik and need help with work.`)}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-outline btn-whatsapp"
              >
                <MessageSquare size={18} /> WhatsApp
              </a>
            )}

            <button 
              className="btn btn-outline btn-inapp-chat"
              onClick={() => setShowChat(true)}
            >
              💬 In-App Chat
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="worker-info-grid stagger-children">
          {/* 1. Rates Card */}
          <div className="worker-grid-card glass-card">
            <div className="card-icon-circle accent">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="grid-label">Visiting / Starting Rate</span>
              <strong className="grid-value rate">
                {formatAmount(worker.rate, worker.currency || '₹')}
                <small className="unit">/{worker.rateUnit || 'visit'}</small>
              </strong>
            </div>
          </div>

          {/* 2. Working Hours Card */}
          <div className="worker-grid-card glass-card">
            <div className="card-icon-circle secondary">
              <Clock size={20} />
            </div>
            <div>
              <span className="grid-label">Working Hours</span>
              <strong className="grid-value">{worker.workingHours || '09:00 AM - 08:00 PM'}</strong>
              <span className="grid-subtext">{worker.workingDays || 'Monday - Saturday'}</span>
            </div>
          </div>

          {/* 3. Location & Area */}
          <div className="worker-grid-card glass-card">
            <div className="card-icon-circle success">
              <MapPin size={20} />
            </div>
            <div>
              <span className="grid-label">Living Area & Base</span>
              <strong className="grid-value">{worker.livingArea || 'Nearby Area'}</strong>
              {worker.distance !== undefined && (
                <span className="grid-subtext text-success font-bold">
                  📍 {formatDistance(worker.distance)} from your current location
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Services & Bio Description */}
        <div className="worker-section-card glass-card animate-fade-in-up">
          <h3>Services & Specialization</h3>
          <p className="worker-full-desc">
            {worker.description || 'Specialist available for all repair and installation services. Contact directly for immediate assistance.'}
          </p>

          {worker.emergencyAvailable && (
            <div className="emergency-callout-banner mt-3">
              <Sparkles size={18} className="text-warning" />
              <div>
                <strong>24/7 Emergency Breakdown Service Available</strong>
                <p className="text-xs text-secondary">Call anytime for urgent breakdown or fault repairs.</p>
              </div>
            </div>
          )}
        </div>

        {/* Safety Notice */}
        <div className="worker-safety-card glass-card animate-fade-in">
          <ShieldCheck size={20} className="text-primary" />
          <div className="text-xs text-secondary">
            <strong>Wikwik Hyperlocal Worker Guarantee</strong>
            <p>Connect and negotiate directly with local workers offline with 0 commission.</p>
          </div>
        </div>

        {/* Chat Drawer */}
        {showChat && (
          <ChatDrawer
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            gigTitle={`Service with ${worker.name} (${worker.profession})`}
            currentUserId={user?.id || 'guest'}
            otherUser={{ name: worker.name }}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
};

export default WorkerDetail;
