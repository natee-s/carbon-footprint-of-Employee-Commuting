import React, { useState, useEffect } from 'react';
import { Car, Bus, Train, Bike, Copy, CheckCircle, Send } from 'lucide-react';

export default function UserCheckIn() {
  // --- 1. State สำหรับเก็บข้อมูลจาก Backend ---
  const [factors, setFactors] = useState([]); // เก็บค่า EF 
  const [routes, setRoutes] = useState([]);   // เก็บสายรถตู้

  // --- 2. State สำหรับเก็บข้อมูลที่พนักงานกำลังกรอก ---
  // ขามา (Leg 1)
  const [leg1, setLeg1] = useState({
    transportType: '',
    fuelType: 'เบนซิน',
    carPoolRole: 'Driver',
    occupancy: 1,
    vanRouteName: '',
    distance: ''
  });

  // ขากลับ (Leg 2)
  const [leg2, setLeg2] = useState({
    transportType: '',
    fuelType: 'เบนซิน',
    carPoolRole: 'Driver',
    occupancy: 1,
    vanRouteName: '',
    distance: ''
  });

  const [sameAsLeg1, setSameAsLeg1] = useState(false); // สวิตช์ "ขากลับเหมือนขามา"
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // --- 3. ดึงข้อมูล EF และสายรถตู้ตอนเปิดหน้าเว็บ ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [efRes, routeRes] = await Promise.all([
          fetch('http://localhost:5000/api/emission-factors'),
          fetch('http://localhost:5000/api/van-routes')
        ]);
        const efJson = await efRes.json();
        const routeJson = await routeRes.json();
        if (efJson.success) setFactors(efJson.data);
        if (routeJson.success) setRoutes(routeJson.data);
      } catch (err) {
        console.error('โหลดข้อมูลอ้างอิงไม่สำเร็จ');
      }
    };
    fetchData();
  }, []);

  // --- 4. Logic การคำนวณคาร์บอน (แบบ Real-time ก่อนส่ง) ---
  const calculateCarbon = (data) => {
    // 1. ถ้ารถรับส่งบริษัท หรือ เดิน/จักรยาน ให้คาร์บอนเป็น 0 ไปก่อน (เดี๋ยวแอดมินไปหารเฉลี่ยปลายเดือน)
    if (data.transportType === 'รถรับส่งบริษัท' || data.transportType === 'เดิน/จักรยาน') return 0;
    
    // 2. หาค่า EF จากตารางที่โหลดมา
    const factorObj = factors.find(f => f.transportType === data.transportType && (data.transportType !== 'รถยนต์ส่วนตัว' || f.fuelType === data.fuelType));
    
    // ถ้าหาค่า EF ไม่เจอ ให้เป็น 0 ไว้ก่อน
    if (!factorObj) return 0;

    // 3. สูตรคำนวณ: (ระยะทาง x ค่า EF) / จำนวนคน
    const totalCarbon = (Number(data.distance) * factorObj.efValue) / Number(data.occupancy);
    return totalCarbon; // คืนค่าตัวเลขกลับไป
  };

  // --- 5. เมื่อกดสวิตช์ "ขากลับเหมือนขามา" ---
  const handleToggleSame = () => {
    setSameAsLeg1(!sameAsLeg1);
    if (!sameAsLeg1) {
      setLeg2(leg1); // ก๊อปปี้ข้อมูลขามา ไปทับขากลับทันที
    }
  };

  // --- 6. ฟังก์ชันเมื่อกดปุ่ม "ส่งข้อมูล" ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('กำลังบันทึกข้อมูล...');

    try {
      // เตรียมข้อมูลขามา
      const payload1 = {
        activityType: 'Employee Commuting',
        leg: 'ขามาทำงาน',
        ...leg1,
        carbonEmission: calculateCarbon(leg1)
      };

      // เตรียมข้อมูลขากลับ (ดึงจาก leg2 หรือ leg1 ขึ้นอยู่กับปุ่มสวิตช์)
      const finalLeg2 = sameAsLeg1 ? leg1 : leg2;
      const payload2 = {
        activityType: 'Employee Commuting',
        leg: 'ขากลับบ้าน',
        ...finalLeg2,
        carbonEmission: calculateCarbon(finalLeg2)
      };

      // ยิงข้อมูล 2 ก้อนไปหา Backend พร้อมกัน
      await Promise.all([
        fetch('http://localhost:5000/api/carbon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload1) }),
        fetch('http://localhost:5000/api/carbon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload2) })
      ]);

      setMessage('✅ บันทึกการเดินทางสำเร็จ! ขอบคุณที่ช่วยลดคาร์บอน');
      // รีเซ็ตฟอร์ม
      setTimeout(() => window.location.reload(), 2000); 
    } catch (err) {
      setMessage('❌ เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // --- Component ย่อย: ปุ่มการ์ดเลือกพาหนะ (ช่วยให้โค้ดดูสะอาดขึ้น) ---
  const TransportCard = ({ icon: Icon, title, legData, setLegData }) => (
    <div 
      onClick={() => setLegData({ ...legData, transportType: title, fuelType: 'เบนซิน', occupancy: 1, distance: '' })}
      className={`cursor-pointer p-4 rounded-xl border-2 text-center transition flex flex-col items-center gap-2
        ${legData.transportType === title ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300'}`}
    >
      <Icon size={32} className={legData.transportType === title ? 'text-green-600' : 'text-gray-400'} />
      <span className="font-semibold text-sm">{title}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
        
        <div className="bg-green-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold">🌿 เช็คอินการเดินทาง (Check-In)</h1>
          <p className="text-green-100 mt-1">ช่วยกันบันทึกคาร์บอนฟุตพริ้นท์ เพื่อโลกของเรา</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          {message && (
            <div className={`p-4 rounded-lg text-center font-bold ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {message}
            </div>
          )}

          {/* ================= ส่วนที่ 1: ขามาทำงาน ================= */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 border-b pb-2">
              <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center">1</span> 
              เดินทางมาทำงาน (ขามา)
            </h2>
            
            {/* 1-Click Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <TransportCard icon={Car} title="รถยนต์ส่วนตัว" legData={leg1} setLegData={setLeg1} />
              <TransportCard icon={Bike} title="รถจักรยานยนต์" legData={leg1} setLegData={setLeg1} />
              <TransportCard icon={Bus} title="รถรับส่งบริษัท" legData={leg1} setLegData={setLeg1} />
              <TransportCard icon={Train} title="รถโดยสารสาธารณะ" legData={leg1} setLegData={setLeg1} />
            </div>

            {/* ส่วนขยาย (ขยายเมื่อจิ้มเลือกการ์ด) */}
            {leg1.transportType === 'รถยนต์ส่วนตัว' && (
              <div className="bg-gray-50 p-4 rounded-xl space-y-4 border animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">ขับมาเอง หรือ อาศัยเพื่อน?</label>
                    <select value={leg1.carPoolRole} onChange={e => setLeg1({...leg1, carPoolRole: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                      <option value="Driver">🔘 ฉันเป็นคนขับ (รับจบ)</option>
                      <option value="Passenger">🔘 นั่งมากับเพื่อน (Eco-Friendly!)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">เชื้อเพลิงที่ใช้</label>
                    <select value={leg1.fuelType} onChange={e => setLeg1({...leg1, fuelType: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none">
                      <option value="เบนซิน">เบนซิน</option>
                      <option value="ดีเซล">ดีเซล</option>
                      <option value="EV">EV (ไฟฟ้า)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">ระยะทางที่เดินทาง (กม.)</label>
                    <input type="number" required min="1" value={leg1.distance} onChange={e => setLeg1({...leg1, distance: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="เช่น 15" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">นั่งมากี่คน? (รวมคนขับ)</label>
                    <input type="number" required min="1" value={leg1.occupancy} onChange={e => setLeg1({...leg1, occupancy: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                </div>
              </div>
            )}

            {leg1.transportType === 'รถรับส่งบริษัท' && (
              <div className="bg-gray-50 p-4 rounded-xl border animate-fade-in">
                <label className="block text-sm font-medium mb-1">เลือกสายรถตู้</label>
                <select value={leg1.vanRouteName} onChange={e => setLeg1({...leg1, vanRouteName: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required>
                  <option value="">-- กรุณาเลือกสายรถ --</option>
                  {routes.map(r => (
                    <option key={r._id} value={r.routeName}>{r.routeName}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">*ไม่ต้องกรอกระยะทาง ระบบจะคำนวณจากเส้นทางอัตโนมัติ</p>
              </div>
            )}

            {/* สำหรับมอเตอร์ไซค์ หรือ รถสาธารณะ (ให้กรอกแค่ระยะทาง) */}
            {(leg1.transportType === 'รถจักรยานยนต์' || leg1.transportType === 'รถโดยสารสาธารณะ') && (
              <div className="bg-gray-50 p-4 rounded-xl border animate-fade-in">
                <label className="block text-sm font-medium mb-1">ระยะทางที่เดินทาง (กม.)</label>
                <input type="number" required min="1" value={leg1.distance} onChange={e => setLeg1({...leg1, distance: e.target.value})} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="เช่น 5" />
              </div>
            )}
          </div>

          {/* ================= ส่วนที่ 2: ขากลับบ้าน ================= */}
          <div className="space-y-4 pt-4 border-t border-dashed border-gray-300">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <span className="bg-orange-100 text-orange-700 w-8 h-8 rounded-full flex items-center justify-center">2</span> 
                เดินทางกลับบ้าน (ขากลับ)
              </h2>
              
              {/* ปุ่มเวทมนตร์ ขากลับเหมือนขามา */}
              <button type="button" onClick={handleToggleSame} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition ${sameAsLeg1 ? 'bg-green-100 text-green-700 border-green-500 border' : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'}`}>
                {sameAsLeg1 ? <CheckCircle size={16} /> : <Copy size={16} />}
                {sameAsLeg1 ? 'ใช้ข้อมูลเหมือนขามาแล้ว' : 'ขากลับเหมือนขามา'}
              </button>
            </div>

            {/* ถ้าไม่ได้กดปุ่ม "เหมือนขามา" ถึงจะโชว์ให้กรอกใหม่ */}
            {!sameAsLeg1 && (
              <div className="opacity-80">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <TransportCard icon={Car} title="รถยนต์ส่วนตัว" legData={leg2} setLegData={setLeg2} />
                  <TransportCard icon={Bike} title="รถจักรยานยนต์" legData={leg2} setLegData={setLeg2} />
                  <TransportCard icon={Bus} title="รถรับส่งบริษัท" legData={leg2} setLegData={setLeg2} />
                  <TransportCard icon={Train} title="รถโดยสารสาธารณะ" legData={leg2} setLegData={setLeg2} />
                </div>
                {/* (เพื่อความสั้นกระชับ ติวเตอร์ซ่อนฟอร์มย่อยของขากลับไว้ก่อน ให้เน้นใช้ปุ่มเหมือนขามาครับ) */}
                <p className="text-center text-sm text-gray-500 mt-2">กรุณากดปุ่ม <b>"ขากลับเหมือนขามา"</b> หรือกรอกข้อมูลใหม่</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg transition duration-200 flex justify-center items-center gap-2 text-lg disabled:opacity-50">
            <Send size={24} /> 
            {loading ? 'กำลังส่งข้อมูล...' : 'บันทึกการเดินทาง (Check-In)'}
          </button>

        </form>
      </div>
    </div>
  );
}