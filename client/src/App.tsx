import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import UserDashboard from './components/UserDashboard';
import Profile from './components/Profile';

function App() {
  const token = localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/" element={<Navigate to={token ? "/profile" : "/auth"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
