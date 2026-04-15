import React, { useState, useEffect } from 'react';
import { Car, Bus, Train, Bike, CheckCircle, Send, Leaf, Calendar, Zap } from 'lucide-react';

export default function UserCheckIn() {
  const [factors, setFactors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [totalResult, setTotalResult] = useState(0);

  const userInfo = { name: "คุณแมน (Natee Siriudom)" }; 
  const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  const [leg1, setLeg1] = useState({ transportType: '', fuelType: 'เบนซิน', carPoolRole: 'Driver', occupancy: 1, vanRouteName: '', distance: '' });
  const [leg2, setLeg2] = useState({ transportType: '', fuelType: 'เบนซิน', carPoolRole: 'Driver', occupancy: 1, vanRouteName: '', distance: '' });
  const [sameAsLeg1, setSameAsLeg1] = useState(false);
  const [loading, setLoading] = useState(false);

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
      } catch (err) { console.error('Error fetching data'); }
    };
    fetchData();
  }, []);

  const handleOneClickFill = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/carbon');
      const json = await response.json();
      if (json.success && json.data.length > 0) {
        const lastLeg1 = json.data.find(r => r.leg === 'ขามาทำงาน');
        if (lastLeg1) {
          setLeg1({
            transportType: lastLeg1.transportType,
            fuelType: lastLeg1.fuelType || 'เบนซิน',
            carPoolRole: lastLeg1.carPoolRole || 'Driver',
            occupancy: lastLeg1.occupancy || 1,
            vanRouteName: lastLeg1.vanRouteName || '',
            distance: lastLeg1.distance || ''
          });
          setSameAsLeg1(true); 
          alert('✨ ดึงข้อมูลการเดินทางล่าสุดของคุณมาเติมให้เรียบร้อยแล้วครับ!');
        } else {
          alert('ยังไม่พบประวัติการเดินทางของคุณครับ');
        }
      }
    } catch (err) {
      alert('ไม่สามารถดึงข้อมูลเก่าได้ครับ');
    }
    setLoading(false);
  };

  const handleToggleSame = () => setSameAsLeg1(!sameAsLeg1);

  const calculateCarbon = (data) => {
    let dist = Number(data.distance);
    let divisor = Number(data.occupancy) || 1;
    if (data.transportType === 'รถรับส่งบริษัท') {
      const route = routes.find(r => r.routeName === data.vanRouteName);
      dist = route ? route.distance : 0;
      divisor = route?.passengerCount || 1;
    }
    const factorObj = factors.find(f => f.transportType === data.transportType && (data.transportType !== 'รถยนต์ส่วนตัว' || f.fuelType === data.fuelType));
    if (!factorObj || dist === 0) return 0;
    return (dist * factorObj.efValue) / divisor;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const c1 = calculateCarbon(leg1);
    const c2 = calculateCarbon(sameAsLeg1 ? leg1 : leg2);
    const sum = c1 + c2;

    try {
      await Promise.all([
        fetch('http://localhost:5000/api/carbon', { 
          method: 'POST', headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ...leg1, activityType: 'Employee Commuting', carbonEmission: c1, leg: 'ขามาทำงาน' }) 
        }),
        fetch('http://localhost:5000/api/carbon', { 
          method: 'POST', headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ ...(sameAsLeg1 ? leg1 : leg2), activityType: 'Employee Commuting', carbonEmission: c2, leg: 'ขากลับบ้าน' }) 
        })
      ]);
      setTotalResult(sum);
      setShowSummary(true);
    } catch (err) { alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล'); }
    setLoading(false);
  };

  // 🛠️ แก้บั๊กข้อ 1: เปลี่ยนจาก Component (const SubForm = () =>) เป็นฟังก์ชัน Render ธรรมดา
  const renderSubForm = (data, setData) => (
    <div className="mt-5 space-y-4 animate-in slide-in-from-top-4 duration-300">
      {data.transportType === 'รถยนต์ส่วนตัว' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white/60 backdrop-blur-md rounded-[2rem] border border-blue-100 shadow-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 tracking-widest">บทบาท</label>
            <select value={data.carPoolRole} onChange={e => setData({...data, carPoolRole: e.target.value})} className="w-full bg-white p-4 rounded-2xl border-none shadow-sm outline-none focus:ring-4 focus:ring-blue-500/20 text-slate-700 font-bold cursor-pointer transition-all">
              <option value="Driver">ฉันเป็นคนขับ</option>
              <option value="Passenger">นั่งมากับเพื่อน</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 tracking-widest">เชื้อเพลิง</label>
            <select value={data.fuelType} onChange={e => setData({...data, fuelType: e.target.value})} className="w-full bg-white p-4 rounded-2xl border-none shadow-sm outline-none focus:ring-4 focus:ring-blue-500/20 text-slate-700 font-bold cursor-pointer transition-all">
              <option value="เบนซิน">เบนซิน</option>
              <option value="ดีเซล">ดีเซล</option>
              <option value="EV">ไฟฟ้า (EV)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 tracking-widest">ระยะทาง (กม.)</label>
            <input type="number" min="0" value={data.distance} onChange={e => setData({...data, distance: e.target.value})} className="w-full bg-white p-4 rounded-2xl border-none shadow-sm outline-none focus:ring-4 focus:ring-blue-500/20 text-blue-600 font-black text-lg transition-all" placeholder="0" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 tracking-widest">จำนวนคนบนรถ</label>
            <input type="number" min="1" value={data.occupancy} onChange={e => setData({...data, occupancy: e.target.value})} className="w-full bg-white p-4 rounded-2xl border-none shadow-sm outline-none focus:ring-4 focus:ring-blue-500/20 text-slate-700 font-black text-lg transition-all" required />
          </div>
        </div>
      )}
      
      {data.transportType === 'รถรับส่งบริษัท' && (
        <div className="p-5 bg-white/60 backdrop-blur-md rounded-[2rem] border border-blue-100 shadow-sm">
          <label className="text-xs font-black text-slate-500 tracking-widest mb-2 block">เลือกสายรถตู้</label>
          <select value={data.vanRouteName} onChange={e => setData({...data, vanRouteName: e.target.value})} className="w-full bg-white p-4 rounded-2xl border-none shadow-sm outline-none focus:ring-4 focus:ring-blue-500/20 text-blue-600 font-black text-lg cursor-pointer transition-all" required>
            <option value="">-- กรุณาเลือกสายรถตู้ --</option>
            {routes.map(r => <option key={r._id} value={r.routeName}>{r.routeName}</option>)}
          </select>
        </div>
      )}

      {(data.transportType === 'รถจักรยานยนต์' || data.transportType === 'รถโดยสารสาธารณะ') && (
        <div className="p-5 bg-white/60 backdrop-blur-md rounded-[2rem] border border-blue-100 shadow-sm">
          <label className="text-xs font-black text-slate-500 tracking-widest mb-2 block">ระยะทาง (กม.)</label>
          <input type="number" min="0" value={data.distance} onChange={e => setData({...data, distance: e.target.value})} className="w-full bg-white p-4 rounded-2xl border-none shadow-sm outline-none focus:ring-4 focus:ring-blue-500/20 text-blue-600 font-black text-lg transition-all" placeholder="0" required />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-gradient-to-br from-cyan-300 to-blue-500 rounded-full blur-3xl opacity-20 -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-gradient-to-tl from-yellow-300 to-orange-400 rounded-full blur-3xl opacity-20 -z-10"></div>

      <header className="bg-gradient-to-br from-blue-500 to-cyan-400 text-white pt-16 pb-12 px-6 rounded-b-[3rem] shadow-xl shadow-blue-500/20">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-3 bg-white/20 w-fit px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/30">
                <Leaf size={16} className="text-yellow-300" />
                <span className="text-xs font-black uppercase tracking-widest text-white">Carbon Tracker</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight drop-shadow-md">สวัสดี, {userInfo.name}</h1>
              <p className="text-blue-50 mt-2 flex items-center gap-2 font-medium"><Calendar size={16}/> วันนี้ {today}</p>
            </div>
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg text-blue-500 font-black text-xl border-4 border-white/50">M</div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-6 -mt-6">
        
        <button 
          type="button"
          onClick={handleOneClickFill}
          className="w-full mb-8 bg-gradient-to-r from-amber-400 to-orange-400 text-white py-4 px-6 rounded-3xl font-black text-sm shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-white/50"
        >
          <Zap fill="currentColor" size={20} />
          เติมข้อมูลจากการเดินทางครั้งล่าสุด (1-Click)
        </button>

        <form onSubmit={handleSubmit} className="space-y-10">
          
          <section>
            <h2 className="text-lg font-black mb-5 flex items-center gap-3 text-slate-800">
              <span className="w-2 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full shadow-sm"></span>
              เดินทางมาทำงาน
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[ {t:'รถยนต์ส่วนตัว', i:Car}, {t:'รถจักรยานยนต์', i:Bike}, {t:'รถรับส่งบริษัท', i:Bus}, {t:'รถโดยสารสาธารณะ', i:Train} ].map(item => (
                <button 
                  key={item.t} type="button" onClick={() => setLeg1({...leg1, transportType: item.t})} 
                  className={`flex flex-col items-center p-6 rounded-[2rem] transition-all duration-300 ease-out border-2
                    ${leg1.transportType === item.t 
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-400 border-transparent text-white shadow-xl shadow-blue-500/30 scale-[1.02]' 
                      : 'bg-white border-white text-slate-400 shadow-sm hover:shadow-md hover:border-blue-100'}`}
                >
                  <item.i size={36} className={leg1.transportType === item.t ? 'text-white' : 'text-slate-300'} strokeWidth={1.5} />
                  <span className={`text-sm font-black mt-4 ${leg1.transportType === item.t ? 'text-white' : 'text-slate-500'}`}>{item.t}</span>
                </button>
              ))}
            </div>
            {/* เรียกใช้ฟังก์ชันแทน Component */}
            {leg1.transportType && renderSubForm(leg1, setLeg1)}
          </section>

          <section>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black flex items-center gap-3 text-slate-800">
                <span className="w-2 h-8 bg-gradient-to-b from-slate-300 to-slate-400 rounded-full shadow-sm"></span>
                เดินทางกลับบ้าน
              </h2>
              <button 
                type="button" onClick={handleToggleSame} 
                className={`text-xs px-5 py-2.5 rounded-full font-black transition-all duration-300 ease-out flex items-center gap-2 border-2
                  ${sameAsLeg1 
                    ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' 
                    : 'bg-white text-slate-400 border-white shadow-sm hover:border-slate-200'}`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${sameAsLeg1 ? 'bg-blue-500 text-white' : 'border-2 border-slate-300'}`}>
                  {sameAsLeg1 && <CheckCircle size={10} strokeWidth={4} />}
                </div>
                ใช้ข้อมูลเดียวกันกับขามา
              </button>
            </div>
            
            {!sameAsLeg1 && (
              <div className="animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  {[ {t:'รถยนต์ส่วนตัว', i:Car}, {t:'รถจักรยานยนต์', i:Bike}, {t:'รถรับส่งบริษัท', i:Bus}, {t:'รถโดยสารสาธารณะ', i:Train} ].map(item => (
                    <button 
                      key={item.t} type="button" onClick={() => setLeg2({...leg2, transportType: item.t})} 
                      className={`flex flex-col items-center p-6 rounded-[2rem] transition-all duration-300 ease-out border-2
                        ${leg2.transportType === item.t 
                          ? 'bg-gradient-to-br from-blue-500 to-cyan-400 border-transparent text-white shadow-xl shadow-blue-500/30 scale-[1.02]' 
                          : 'bg-white border-white text-slate-400 shadow-sm hover:shadow-md hover:border-blue-100'}`}
                    >
                      <item.i size={36} className={leg2.transportType === item.t ? 'text-white' : 'text-slate-300'} strokeWidth={1.5} />
                      <span className={`text-sm font-black mt-4 ${leg2.transportType === item.t ? 'text-white' : 'text-slate-500'}`}>{item.t}</span>
                    </button>
                  ))}
                </div>
                {/* เรียกใช้ฟังก์ชันแทน Component */}
                {leg2.transportType && renderSubForm(leg2, setLeg2)}
              </div>
            )}
          </section>

          <button 
            type="submit" 
            disabled={loading || !leg1.transportType || (!sameAsLeg1 && !leg2.transportType)} 
            className="w-full bg-gradient-to-r from-emerald-400 to-green-500 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-white/20"
          >
            {loading ? 'กำลังประมวลผล...' : 'บันทึกการเดินทาง'} <Send size={22} />
          </button>
        </form>
      </main>

      {showSummary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-500 border-4 border-white/50">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/30">
              <CheckCircle size={48} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">บันทึกสำเร็จ!</h3>
            <p className="text-slate-500 text-sm font-bold leading-relaxed">การเดินทางของคุณวันนี้ปล่อยคาร์บอนฯ</p>
            <div className="my-6 bg-gradient-to-br from-slate-50 to-blue-50 py-8 rounded-[2rem] border border-blue-100 shadow-inner">
              <span className="text-6xl font-black text-blue-600 drop-shadow-sm">{totalResult.toFixed(3)}</span>
              {/* 🛠️ แก้บั๊กข้อ 2: เอาคำว่า uppercase ออกจากหน่วยตรงนี้ครับ */}
              <span className="text-sm font-black text-slate-400 block mt-2 tracking-widest">kgCO2e</span>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black mt-2 hover:bg-slate-900 transition-colors shadow-lg shadow-slate-800/20"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}