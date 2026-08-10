import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, Car, Bike, ArrowRight, Calendar, Navigation } from 'lucide-react';
import { formatDate, formatTime, formatAmount, formatDistance, getInitials } from '../../utils/helpers';
import './RideCard.css';

const RideCard = ({ ride }) => {
  const isBike = ride.vehicleType === 'bike';
  const VehicleIcon = isBike ? Bike : Car;

  const approvedCount = (ride.passengers || []).filter(p => p.status === 'approved').length;
  const pendingCount = (ride.passengers || []).filter(p => p.status === 'pending').length;

  return (
    <Link to={`/travel/ride/${ride.id}`} className={`ride-card glass-card ${isBike ? 'ride-bike' : 'ride-car'}`}>
      <div className="ride-card-header">
        <div className={`ride-vehicle-badge ${ride.vehicleType}`}>
          <VehicleIcon size={16} />
          <span>{isBike ? 'Bike' : 'Car'}</span>
        </div>
        <div className="ride-card-header-right">
          <span className="ride-card-date">
            <Calendar size={12} />
            {formatDate(ride.departureDate)}
          </span>
        </div>
      </div>

      <div className="ride-route">
        <div className="ride-route-point origin">
          <div className="route-dot origin-dot"></div>
          <div className="route-point-details">
            <span className="route-text">{ride.origin?.address || 'Origin'}</span>
            {ride.distFromSearchOrigin !== null && ride.distFromSearchOrigin !== undefined && (
              <span className="route-distance-tag">
                📍 {ride.distFromSearchOrigin.toFixed(1)} km from your start
              </span>
            )}
          </div>
        </div>
        <div className="ride-route-line">
          <ArrowRight size={14} className="route-arrow" />
        </div>
        <div className="ride-route-point destination">
          <div className="route-dot dest-dot"></div>
          <div className="route-point-details">
            <span className="route-text">{ride.destination?.address || 'Destination'}</span>
            {ride.distFromSearchDest !== null && ride.distFromSearchDest !== undefined && (
              <span className="route-distance-tag dest-tag">
                🏁 {ride.distFromSearchDest.toFixed(1)} km from your destination
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="ride-card-meta">
        <div className="ride-card-price">
          <span>{formatAmount(ride.pricePerSeat, ride.currency || '₹')}</span>
          <small>/seat</small>
        </div>
        <div className="ride-card-info">
          <div className="ride-card-info-item">
            <Clock size={12} />
            <span>{formatTime(ride.departureDate)}</span>
          </div>
          <div className="ride-card-info-item">
            <Users size={12} />
            <span>{approvedCount}/{ride.seatsAvailable} seats</span>
          </div>
        </div>
      </div>

      <div className="ride-card-footer">
        <div className="ride-card-driver">
          <div className="avatar avatar-sm">
            {getInitials(ride.driverName)}
          </div>
          <span className="driver-name">{ride.driverName}</span>
        </div>

        <div className="ride-card-badges">
          {pendingCount > 0 && (
            <span className="badge badge-info">{pendingCount} pending</span>
          )}
          {ride.status === 'active' && (
            <span className="badge badge-success">Available</span>
          )}
          {ride.status === 'full' && (
            <span className="badge badge-warning">Full</span>
          )}
          {ride.status === 'completed' && (
            <span className="badge badge-primary">Completed</span>
          )}
          {ride.status === 'cancelled' && (
            <span className="badge badge-error">Cancelled</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RideCard;
