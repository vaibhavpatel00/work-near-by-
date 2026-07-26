import { useState } from 'react';
import { useGigs } from '../../context/GigContext';
import { useAuth } from '../../context/AuthContext';
import GigCard from '../../components/Cards/GigCard';
import { Clock, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import './History.css';

const History = () => {
  const [tab, setTab] = useState('posted'); // 'posted' | 'booked'
  const { getMyPostedGigs, getMyBookedGigs } = useGigs();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="page-content">
        <div className="history-guest animate-fade-in text-center p-6">
          <Clock size={48} className="text-tertiary mb-4" />
          <h2>History</h2>
          <p className="text-secondary mt-2 mb-6">Log in to view your posted requirements and accepted work history.</p>
          <Link to="/login" className="btn btn-primary btn-lg">Log In / Sign Up</Link>
        </div>
      </div>
    );
  }

  const postedGigs = getMyPostedGigs();
  const bookedGigs = getMyBookedGigs();

  const currentGigs = tab === 'posted' ? postedGigs : bookedGigs;

  return (
    <div className="page-content">
      <div className="history-page">
        <header className="history-header animate-fade-in">
          <h1>Activity History</h1>
          <p className="text-secondary">Track all your posted requirements and accepted work</p>
        </header>

        {/* Tab Switcher */}
        <div className="history-tabs animate-fade-in-up">
          <button
            className={`history-tab ${tab === 'posted' ? 'active' : ''}`}
            onClick={() => setTab('posted')}
          >
            My Posts ({postedGigs.length})
          </button>
          <button
            className={`history-tab ${tab === 'booked' ? 'active' : ''}`}
            onClick={() => setTab('booked')}
          >
            My Bookings ({bookedGigs.length})
          </button>
        </div>

        {/* List */}
        {currentGigs.length > 0 ? (
          <div className="history-list stagger-children">
            {currentGigs.map(gig => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        ) : (
          <div className="history-empty animate-fade-in-up">
            <div className="history-empty-icon">📂</div>
            <h3>No {tab === 'posted' ? 'posted requirements' : 'accepted bookings'} yet</h3>
            <p className="text-secondary text-sm">
              {tab === 'posted'
                ? 'Need a driver, chef, cleaner, or security today? Post your requirement now!'
                : 'Browse available work near you and accept to start earning.'}
            </p>
            {tab === 'posted' ? (
              <Link to="/post" className="btn btn-primary mt-4">
                <PlusCircle size={18} /> Post Work
              </Link>
            ) : (
              <Link to="/" className="btn btn-outline mt-4">
                Explore Nearby Work
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
