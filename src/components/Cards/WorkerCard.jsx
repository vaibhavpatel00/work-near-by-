import { Link } from 'react-router-dom';
import { 
  Phone, MessageSquare, MapPin, Clock, Star, 
  ShieldCheck, Zap, Wrench, CheckCircle, ArrowRight, Award, AlertCircle
} from 'lucide-react';
import { getCategoryById } from '../../data/categories';
import { formatDistance, formatAmount, getInitials } from '../../utils/helpers';
import './WorkerCard.css';

const WorkerCard = ({ worker }) => {
  const category = getCategoryById(worker.profession);
  const CategoryIcon = category?.icon || Wrench;

  const rawPhone = (worker.phone || '').replace(/\D/g, '');
  const rawWhatsApp = (worker.whatsapp || worker.phone || '').replace(/\D/g, '');

  return (
    <div className={`worker-card glass-card ${category?.cssClass || ''}`}>
      <div className="worker-card-header">
        <div className="worker-avatar-box">
          <div className="avatar avatar-md">
            {getInitials(worker.name)}
          </div>
          {worker.emergencyAvailable && (
            <span className="emergency-indicator-dot" title="24/7 Emergency Available"></span>
          )}
        </div>

        <div className="worker-info-main">
          <div className="worker-name-row">
            <Link to={`/worker/${worker.id}`} className="worker-name-link">
              <h3 className="worker-name">{worker.name}</h3>
            </Link>
            <span className="verified-shield-icon" title="Verified Professional Worker">
              <ShieldCheck size={16} />
            </span>
          </div>

          <div className="worker-profession-tag">
            <CategoryIcon size={13} />
            <span>{worker.customProfession || category?.name || worker.profession}</span>
          </div>
        </div>
      </div>

      <p className="worker-card-bio">{worker.description || 'Specialist available for all repair and installation services.'}</p>

      {/* Meta Grid */}
      <div className="worker-meta-grid">
        <div className="worker-meta-item">
          <MapPin size={13} className="text-accent" />
          <span className="meta-text">{worker.livingArea || 'Nearby Area'}</span>
          {worker.distance !== undefined && (
            <span className="worker-dist-pill">{formatDistance(worker.distance)} away</span>
          )}
        </div>

        <div className="worker-meta-item">
          <Clock size={13} className="text-secondary" />
          <span className="meta-text">{worker.workingHours || '9:00 AM - 8:00 PM'} ({worker.workingDays || 'Mon-Sat'})</span>
        </div>
      </div>

      <div className="worker-card-footer">
        <div className="worker-rate-box">
          {worker.rate && Number(worker.rate) > 0 ? (
            <>
              <span className="rate-num">
                {formatAmount(worker.rate, worker.currency || '₹')}
              </span>
              <span className="rate-unit">/{worker.rateUnit || 'visit'}</span>
            </>
          ) : (
            <span className="rate-contact-tag">
              📞 Direct Contact
            </span>
          )}
        </div>

        <div className="worker-actions-row">
          {worker.phone && (
            <a 
              href={`tel:${worker.phone}`} 
              className="btn btn-outline btn-sm worker-call-btn"
              title="Call Worker directly"
            >
              <Phone size={14} /> Call
            </a>
          )}

          {(worker.whatsapp || worker.phone) && (
            <a 
              href={`https://wa.me/${rawWhatsApp}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-outline btn-sm worker-whatsapp-btn"
              title="Chat on WhatsApp"
            >
              <MessageSquare size={14} /> WhatsApp
            </a>
          )}

          <Link to={`/worker/${worker.id}`} className="btn btn-primary btn-sm">
            View <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WorkerCard;
