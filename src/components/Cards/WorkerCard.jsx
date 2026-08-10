import { Link } from 'react-router-dom';
import { 
  MapPin, Clock, ShieldCheck, Wrench, ArrowRight, Zap
} from 'lucide-react';
import { getCategoryById } from '../../data/categories';
import { formatDistance, getInitials } from '../../utils/helpers';
import './WorkerCard.css';

const WorkerCard = ({ worker }) => {
  const category = getCategoryById(worker.profession);
  const CategoryIcon = category?.icon || Wrench;

  return (
    <div className={`worker-card glass-card ${category?.cssClass || ''}`}>
      <div className="worker-card-header">
        <div className="worker-avatar-box">
          <div className="avatar avatar-md">
            {getInitials(worker.name)}
          </div>
          {worker.emergencyAvailable && (
            <span className="emergency-indicator-dot" title="Emergency Available"></span>
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
        <div className="worker-status-badge">
          <span className="status-live-dot"></span>
          <span className="status-text">{worker.workingDays || 'Available'}</span>
        </div>

        <Link to={`/worker/${worker.id}`} className="btn btn-primary btn-sm view-profile-btn">
          View Profile & Contact <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default WorkerCard;
