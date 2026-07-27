import { Link } from 'react-router-dom';
import { MapPin, Clock, IndianRupee, Paperclip, Users } from 'lucide-react';
import { getCategoryById } from '../../data/categories';
import { useGigs } from '../../context/GigContext';
import { formatDistance, timeAgo, formatDate, formatAmount, truncateText, getInitials } from '../../utils/helpers';
import './GigCard.css';

const GigCard = ({ gig }) => {
  const category = getCategoryById(gig.category);
  const { getUserById } = useGigs();
  const poster = getUserById(gig.postedBy);
  const CategoryIcon = category?.icon;

  const appCount = (gig.requests || []).length;
  const maxApps = gig.maxApplications || 5;

  return (
    <Link to={`/gig/${gig.id}`} className={`gig-card glass-card ${category?.cssClass || ''}`}>
      <div className="gig-card-header">
        <div className={`gig-card-category`}>
          {CategoryIcon && <CategoryIcon size={14} />}
          <span>{category?.name || gig.category}</span>
        </div>
        <div className="gig-card-header-right">
          {gig.attachments && gig.attachments.length > 0 && (
            <span className="att-badge-icon" title={`${gig.attachments.length} attachment(s)`}>
              <Paperclip size={12} />
            </span>
          )}
          <span className="gig-card-time">{timeAgo(gig.postedAt)}</span>
        </div>
      </div>

      <h3 className="gig-card-title">{gig.title}</h3>
      <p className="gig-card-desc">{truncateText(gig.description, 90)}</p>

      <div className="gig-card-meta">
        <div className="gig-card-amount">
          <IndianRupee size={14} />
          <span>{gig.amount.toLocaleString('en-IN')}</span>
        </div>
        <div className="gig-card-info">
          <div className="gig-card-info-item">
            <Clock size={12} />
            <span>{formatDate(gig.date)}</span>
          </div>
          <div className="gig-card-info-item">
            <MapPin size={12} />
            <span>{gig.distance !== undefined ? formatDistance(gig.distance) : gig.location.address}</span>
          </div>
        </div>
      </div>

      <div className="gig-card-footer">
        <div className="gig-card-poster">
          <div className="avatar avatar-sm">
            {getInitials(poster.name)}
          </div>
          <span className="poster-name">{poster.name}</span>
        </div>

        <div className="gig-card-badges">
          <span className="badge-apps-count">
            <Users size={11} /> {appCount}/{maxApps}
          </span>

          {gig.status === 'active' && (
            <span className="badge badge-success">Open</span>
          )}
          {gig.status === 'expired' && (
            <span className="badge badge-error">Expired</span>
          )}
          {gig.status === 'booked' && (
            <span className="badge badge-warning">Booked</span>
          )}
          {gig.status === 'completed' && (
            <span className="badge badge-primary">Done</span>
          )}
          {gig.status === 'cancelled' && (
            <span className="badge badge-error">Cancelled</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default GigCard;
