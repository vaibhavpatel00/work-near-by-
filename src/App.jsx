import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { GigProvider } from './context/GigContext';

import Navbar from './components/Layout/Navbar';
import BottomNav from './components/Layout/BottomNav';
import Toast from './components/UI/Toast';

import Home from './pages/Home/Home';
import Explore from './pages/Explore/Explore';
import PostGig from './pages/PostGig/PostGig';
import GigDetail from './pages/GigDetail/GigDetail';
import Profile from './pages/Profile/Profile';
import History from './pages/History/History';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <GigProvider>
            <div className="app-layout">
              <Navbar />
              <Toast />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/post" element={<PostGig />} />
                <Route path="/gig/:id" element={<GigDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/history" element={<History />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Routes>
              <BottomNav />
            </div>
          </GigProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
