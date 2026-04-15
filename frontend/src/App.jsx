import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import UserCheckIn from './pages/UserCheckIn';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* หน้าหลักของพนักงาน */}
        <Route path="/" element={<UserCheckIn />} />
        
        {/* หน้าซ่อนสำหรับแอดมิน */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* หน้า dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;