import React, { useState, useEffect } from 'react';
import { Database, PlusCircle, Save, Activity, Bus, Trash2, Download, FileText, Table as TableIcon } from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminDashboard() {
  const [factors, setFactors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [carbonRecords, setCarbonRecords] = useState([]); 
  
  const [efFormData, setEfFormData] = useState({ transportType: 'รถยนต์ส่วนตัว', fuelType: 'เบนซิน', efValue: '', unit: 'kgCO2e/km' });
  const [routeFormData, setRouteFormData] = useState({ routeName: '', distance: '', passengerCount: '' });
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('EF'); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const [efRes, routeRes, carbonRes] = await Promise.all([
        fetch('https://carbon-footprint-of-employee-commuting.onrender.com/api/emission-factors'),
        fetch('https://carbon-footprint-of-employee-commuting.onrender.com/api/van-routes'),
        fetch('https://carbon-footprint-of-employee-commuting.onrender.com/api/carbon')
      ]);
      const efJson = await efRes.json();
      const routeJson = await routeRes.json();
      const carbonJson = await carbonRes.json();

      if (efJson.success) setFactors(efJson.data);
      if (routeJson.success) setRoutes(routeJson.data);
      if (carbonJson.success) setCarbonRecords(carbonJson.data);
    } catch (error) {
      setMessage('❌ ไม่สามารถเชื่อมต่อกับ Server ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEfSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://carbon-footprint-of-employee-commuting.onrender.com/api/emission-factors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...efFormData, efValue: Number(efFormData.efValue) })
      });
      if ((await response.json()).success) {
        setMessage('✅ บันทึกค่า EF สำเร็จ!');
        setEfFormData({ ...efFormData, efValue: '' });
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) { setMessage('❌ บันทึกไม่สำเร็จ'); }
  };

  const handleDeleteEf = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) return;
    const response = await fetch(`https://carbon-footprint-of-employee-commuting.onrender.com/api/emission-factors/${id}`, { method: 'DELETE' });
    if ((await response.json()).success) fetchData();
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://carbon-footprint-of-employee-commuting.onrender.com/api/van-routes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...routeFormData, distance: Number(routeFormData.distance), passengerCount: Number(routeFormData.passengerCount) })
      });
      if ((await response.json()).success) {
        setMessage('✅ บันทึกสายรถตู้สำเร็จ!');
        setRouteFormData({ routeName: '', distance: '', passengerCount: '' });
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) { setMessage('❌ บันทึกไม่สำเร็จ'); }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('ยืนยันการลบสายรถตู้นี้?')) return;
    const response = await fetch(`https://carbon-footprint-of-employee-commuting.onrender.com/api/van-routes/${id}`, { method: 'DELETE' });
    if ((await response.json()).success) fetchData();
  };

  const handleDeleteCarbon = async (id) => {
    if (!window.confirm('ลบข้อมูลการเดินทางนี้? (ผลรวม Dashboard จะเปลี่ยนไป)')) return;
    try {
      const response = await fetch(`https://carbon-footprint-of-employee-commuting.onrender.com/api/carbon/${id}`, { method: 'DELETE' });
      if ((await response.json()).success) {
        setCarbonRecords(carbonRecords.filter(r => r._id !== id));
        setMessage('🗑️ ลบข้อมูลสำเร็จ');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) { alert('ลบข้อมูลไม่สำเร็จ'); }
  };

  const exportToExcel = () => {
    const ws = utils.json_to_sheet(carbonRecords.map(r => ({
      วันที่: new Date(r.createdAt).toLocaleDateString('th-TH'),
      พาหนะ: r.transportType,
      ประเภท: r.leg,
      ระยะทาง: r.transportType === 'รถรับส่งบริษัท' ? r.vanRouteName : `${r.distance} กม.`,
      เชื้อเพลิง: r.fuelType,
      คาร์บอน_kgCO2e: r.carbonEmission
    })));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "CarbonData");
    writeFile(wb, "Employee_Carbon_Report.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Report: Employee Carbon Footprint (Scope 3)", 14, 15);
    const tableData = carbonRecords.map(r => [
      new Date(r.createdAt).toLocaleDateString('th-TH'), r.transportType, r.leg, r.carbonEmission ? r.carbonEmission.toFixed(3) : '0'
    ]);
    doc.autoTable({ head: [['Date', 'Transport', 'Type', 'kgCO2e']], body: tableData, startY: 20 });
    doc.save("Employee_Carbon_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] p-6 font-sans relative overflow-hidden">
      
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30 -z-10"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        <header className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
          <h1 className="text-4xl font-black text-slate-800 flex items-center gap-4 drop-shadow-sm">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl text-white shadow-lg shadow-blue-500/30">
              <Database size={32} />
            </div>
            Admin Control Panel
          </h1>
          
          <div className="flex bg-white rounded-full shadow-lg shadow-slate-200/50 p-1.5 border border-slate-100">
            <button onClick={() => setActiveTab('EF')} className={`px-6 py-2.5 rounded-full font-black transition-all flex items-center gap-2 ${activeTab === 'EF' ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
              <Activity size={18}/> จัดการค่า EF
            </button>
            <button onClick={() => setActiveTab('VAN')} className={`px-6 py-2.5 rounded-full font-black transition-all flex items-center gap-2 ${activeTab === 'VAN' ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
              <Bus size={18}/> จัดการรถตู้
            </button>
            <button onClick={() => setActiveTab('RECORDS')} className={`px-6 py-2.5 rounded-full font-black transition-all flex items-center gap-2 ${activeTab === 'RECORDS' ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
              <TableIcon size={18}/> ประวัติเดินทาง
            </button>
          </div>
        </header>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl text-center font-black shadow-sm border ${message.includes('✅') ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {message}
          </div>
        )}

        {(activeTab === 'EF' || activeTab === 'VAN') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 h-fit">
              {activeTab === 'EF' ? (
                <form onSubmit={handleEfSubmit} className="space-y-5">
                  <h2 className="text-xl font-black mb-6 text-slate-800 flex items-center gap-3"><PlusCircle size={24} className="text-blue-500"/> เพิ่มค่า EF ใหม่</h2>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 tracking-widest">ประเภทพาหนะ</label>
                    <select value={efFormData.transportType} onChange={(e) => setEfFormData({...efFormData, transportType: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 text-slate-700 font-bold">
                      <option value="รถยนต์ส่วนตัว">รถยนต์ส่วนตัว</option>
                      <option value="รถจักรยานยนต์">รถจักรยานยนต์</option>
                      <option value="รถรับส่งบริษัท">รถรับส่งบริษัท</option>
                      <option value="รถโดยสารสาธารณะ">รถโดยสารสาธารณะ</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 tracking-widest">เชื้อเพลิง</label>
                    <select value={efFormData.fuelType} onChange={(e) => setEfFormData({...efFormData, fuelType: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 text-slate-700 font-bold">
                      <option value="เบนซิน">เบนซิน</option><option value="ดีเซล">ดีเซล</option><option value="EV">ไฟฟ้า (EV)</option><option value="N/A">N/A</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 tracking-widest">ค่า EF (kgCO2e/km)</label>
                    <input type="number" step="0.0001" value={efFormData.efValue} onChange={(e) => setEfFormData({...efFormData, efValue: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 text-blue-600 font-black text-lg" required placeholder="เช่น 0.174" />
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:scale-[1.02] active:scale-[0.98] text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30 mt-4"><Save size={20}/> บันทึกค่า EF</button>
                </form>
              ) : (
                <form onSubmit={handleRouteSubmit} className="space-y-5">
                  <h2 className="text-xl font-black mb-6 text-slate-800 flex items-center gap-3"><Bus size={24} className="text-blue-500"/> เพิ่มสายรถตู้</h2>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 tracking-widest">ชื่อสายรถ</label>
                    <input type="text" value={routeFormData.routeName} onChange={(e) => setRouteFormData({...routeFormData, routeName: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 text-slate-700 font-bold" required placeholder="เช่น สาย A" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 tracking-widest">ระยะทาง (กม.)</label>
                    <input type="number" value={routeFormData.distance} onChange={(e) => setRouteFormData({...routeFormData, distance: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 text-blue-600 font-black text-lg" required placeholder="เช่น 35" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 tracking-widest">ผู้โดยสารเฉลี่ย (คน)</label>
                    <input type="number" value={routeFormData.passengerCount} onChange={(e) => setRouteFormData({...routeFormData, passengerCount: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/20 text-slate-700 font-black text-lg" required placeholder="เช่น 10" />
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-emerald-400 to-green-500 hover:scale-[1.02] active:scale-[0.98] text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/30 mt-4"><Save size={20}/> บันทึกสายรถ</button>
                </form>
              )}
            </div>

            <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100">
              {activeTab === 'EF' ? (
                <>
                  <h2 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-3"><Activity className="text-cyan-500"/> ตาราง Emission Factors</h2>
                  <div className="overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-left bg-white">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          {/* 🛠️ แก้บั๊กข้อ 2: เอา uppercase ออกจากหัวตารางนี้ครับ */}
                          <th className="p-4 text-xs font-black text-slate-400 tracking-widest">พาหนะ</th>
                          <th className="p-4 text-xs font-black text-slate-400 tracking-widest">เชื้อเพลิง</th>
                          <th className="p-4 text-xs font-black text-slate-400 tracking-widest">ค่า EF</th>
                          <th className="p-4 text-xs font-black text-slate-400 tracking-widest text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {factors.map(f => (
                          <tr key={f._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 text-sm font-black text-slate-700">{f.transportType}</td>
                            <td className="p-4"><span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-black tracking-wide border border-blue-100">{f.fuelType}</span></td>
                            <td className="p-4 font-mono font-black text-lg text-slate-800">{f.efValue}</td>
                            <td className="p-4 text-center">
                              <button onClick={() => handleDeleteEf(f._id)} className="p-2.5 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all"><Trash2 size={18} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-3"><Bus className="text-cyan-500"/> รายการสายรถตู้</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {routes.map(r => (
                      <div key={r._id} className="p-6 border border-slate-100 rounded-[1.5rem] bg-white shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                        <div>
                          <div className="font-black text-slate-800 text-xl">{r.routeName}</div>
                          <div className="text-sm font-bold text-slate-400 mt-1 flex items-center gap-2">
                            <span className="bg-slate-100 px-2 py-1 rounded-md">{r.distance} กม.</span> 
                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md">{r.passengerCount || 1} คน</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteRoute(r._id)} className="p-3 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all"><Trash2 size={20} /></button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'RECORDS' && (
          <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <TableIcon className="text-amber-500" size={28} /> ข้อมูลการเดินทาง ({carbonRecords.length} ทริป)
              </h2>
              <div className="flex gap-3">
                <button onClick={exportToExcel} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all border border-emerald-100">
                  <Download size={18}/> Excel
                </button>
                <button onClick={exportToPDF} className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 transition-all border border-red-100">
                  <FileText size={18}/> PDF
                </button>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm h-[600px] overflow-y-auto">
              <table className="w-full text-left relative bg-white">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-100 shadow-sm">
                  <tr>
                    {/* 🛠️ แก้บั๊กข้อ 2: เอา uppercase ออกจากหัวตารางนี้ครับ */}
                    <th className="p-5 text-xs font-black text-slate-400 tracking-widest">วันที่ / เวลา</th>
                    <th className="p-5 text-xs font-black text-slate-400 tracking-widest">พาหนะ</th>
                    <th className="p-5 text-xs font-black text-slate-400 tracking-widest">รายละเอียด</th>
                    <th className="p-5 text-xs font-black text-slate-400 tracking-widest text-right">kgCO2e</th>
                    <th className="p-5 text-xs font-black text-slate-400 tracking-widest text-center">ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {carbonRecords.map(r => (
                    <tr key={r._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 text-sm font-bold text-slate-500">{new Date(r.createdAt).toLocaleString('th-TH')}</td>
                      <td className="p-5">
                        <span className="block font-black text-slate-800">{r.transportType}</span>
                        <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">{r.leg}</span>
                      </td>
                      <td className="p-5 text-sm font-bold text-slate-600">
                        {r.transportType === 'รถรับส่งบริษัท' ? `สาย: ${r.vanRouteName}` : `${r.distance} กม. (${r.fuelType})`}
                      </td>
                      <td className="p-5 text-lg font-black text-emerald-500 text-right">{r.carbonEmission ? r.carbonEmission.toFixed(3) : '0.000'}</td>
                      <td className="p-5 text-center">
                        <button onClick={() => handleDeleteCarbon(r._id)} className="p-2.5 text-slate-300 hover:text-white hover:bg-red-500 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}