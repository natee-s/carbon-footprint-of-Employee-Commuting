import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import UserCheckIn from './pages/UserCheckIn';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* หน้าหลักของพนักงาน */}
        <Route path="/" element={<UserCheckIn />} />
        
        {/* หน้าซ่อนสำหรับแอดมิน */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;