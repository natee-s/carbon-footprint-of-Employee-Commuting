import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { BarChart3, Leaf, Calendar, Filter, Zap, TrendingDown, Users } from 'lucide-react';

export default function Dashboard() {
  const [rawRecords, setRawRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States สำหรับระบบ Filter
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, q1, q2, q3, q4, หรือ YYYY-MM
  const [filterTransport, setFilterTransport] = useState('all');
  const [filterPerson, setFilterPerson] = useState('all'); // รอเชื่อมระบบ Login

  // สีโทน Executive สำหรับกราฟ
  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

  useEffect(() => {
    const fetchCarbonData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/carbon');
        const result = await response.json();
        if (result.success) setRawRecords(result.data);
      } catch (error) {
        console.error('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setLoading(false);
      }
    };
    fetchCarbonData();
  }, []);

  // --- 🧠 Logic 1: ระบบ กรองข้อมูล (Filtering) ---
  const filteredRecords = rawRecords.filter(r => {
    const d = new Date(r.createdAt);
    const month = d.getMonth() + 1;
    const yearMonth = `${d.getFullYear()}-${String(month).padStart(2, '0')}`;
    
    // กรองเวลา (เดือน หรือ ไตรมาส)
    let matchPeriod = true;
    if (filterPeriod !== 'all') {
      if (filterPeriod.startsWith('q')) {
        const q = parseInt(filterPeriod.replace('q', ''));
        matchPeriod = Math.ceil(month / 3) === q;
      } else {
        matchPeriod = yearMonth === filterPeriod;
      }
    }

    // กรองพาหนะ
    const matchTransport = filterTransport === 'all' || r.transportType === filterTransport;
    
    return matchPeriod && matchTransport;
  });

  // --- 🧠 Logic 2: คำนวณ KPI Cards ---
  const totalCarbon = filteredRecords.reduce((sum, r) => sum + (r.carbonEmission || 0), 0);
  const totalTrips = filteredRecords.length;
  const ecoTrips = filteredRecords.filter(r => 
    r.fuelType === 'EV' || 
    r.transportType === 'รถรับส่งบริษัท' || 
    (r.transportType === 'รถยนต์ส่วนตัว' && r.carPoolRole === 'Passenger')
  ).length;
  
  const ecoPercentage = totalTrips === 0 ? 0 : ((ecoTrips / totalTrips) * 100).toFixed(1);
  const avgCarbonPerTrip = totalTrips === 0 ? 0 : (totalCarbon / totalTrips).toFixed(2);

  // --- 🧠 Logic 3: ปั้นข้อมูล กราฟโดนัท (สัดส่วนพาหนะ) ---
  const transportStats = filteredRecords.reduce((acc, r) => {
    const type = r.transportType || 'ไม่ระบุ';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = Object.keys(transportStats).map(key => ({ 
    name: key, 
    value: transportStats[key] 
  })).sort((a, b) => b.value - a.value); // เรียงจากมากไปน้อย

  // ฟังก์ชันวาดตัวเลข % ลงบนกราฟโดนัทโดยตรง
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null; // ถ้าสัดส่วนน้อยกว่า 5% ไม่ต้องโชว์เลขเพื่อความสวยงาม
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold drop-shadow-md">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // --- 🧠 Logic 4: ปั้นข้อมูล กราฟเส้น (Trend แนวโน้มคาร์บอนรายวัน) ---
  const trendStats = filteredRecords.reduce((acc, r) => {
    const dateStr = new Date(r.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, carbon: 0 };
    acc[dateStr].carbon += (r.carbonEmission || 0);
    return acc;
  }, {});
  const trendData = Object.values(trendStats).map(item => ({...item, carbon: Number(item.carbon.toFixed(2))})).reverse();

  // ดึงรายชื่อเดือนที่มีในระบบมาทำ Dropdown
  const availableMonths = [...new Set(rawRecords.map(r => {
    const d = new Date(r.createdAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }))].sort().reverse();

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">กำลังประมวลผลข้อมูล...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ================= Header & Filters ================= */}
        <header className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="text-blue-600" /> Executive Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">สรุปข้อมูลการปล่อยคาร์บอนฟุตพริ้นท์ (Scope 3 Category 7: Employee Commuting)</p>
          </div>
          
          {/* Advanced Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <Filter size={18} className="text-slate-400 ml-2" />
            
            {/* Filter: ช่วงเวลา */}
            <select 
              value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">🕒 ทุกช่วงเวลา</option>
              <optgroup label="แยกตามไตรมาส">
                <option value="q1">ไตรมาส 1 (ม.ค. - มี.ค.)</option>
                <option value="q2">ไตรมาส 2 (เม.ย. - มิ.ย.)</option>
                <option value="q3">ไตรมาส 3 (ก.ค. - ก.ย.)</option>
                <option value="q4">ไตรมาส 4 (ต.ค. - ธ.ค.)</option>
              </optgroup>
              <optgroup label="แยกตามเดือน">
                {availableMonths.map(m => <option key={m} value={m}>เดือน {m}</option>)}
              </optgroup>
            </select>
            
            <div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block"></div>
            
            {/* Filter: พาหนะ */}
            <select 
              value={filterTransport} onChange={(e) => setFilterTransport(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">🚗 ทุกยานพาหนะ</option>
              <option value="รถยนต์ส่วนตัว">รถยนต์ส่วนตัว</option>
              <option value="รถจักรยานยนต์">รถจักรยานยนต์</option>
              <option value="รถรับส่งบริษัท">รถรับส่งบริษัท</option>
              <option value="รถโดยสารสาธารณะ">รถโดยสารสาธารณะ</option>
            </select>

            <div className="w-px h-6 bg-slate-300 mx-1 hidden sm:block"></div>

            {/* Filter: บุคคล (โชว์ไว้รอดึงข้อมูลจากระบบ Login) */}
            <select 
              value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-400 outline-none cursor-not-allowed"
              disabled title="ระบบแยกรายบุคคลจะเปิดใช้งานหลังเพิ่มระบบ Login"
            >
              <option value="all">👤 ทุกบุคคล (รอระบบ Login)</option>
            </select>
          </div>
        </header>

        {/* ================= KPI Cards ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-bold text-slate-500">คาร์บอนรวมทั้งหมด</p>
              <div className="p-2 bg-red-50 text-red-500 rounded-xl"><TrendingDown size={20}/></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{totalCarbon.toFixed(2)}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">kgCO2e</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-bold text-slate-500">จำนวนเที่ยวเดินทาง</p>
              <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Calendar size={20}/></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{totalTrips}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">เที่ยว</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-bold text-slate-500">สัดส่วนทริปสีเขียว</p>
              <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl"><Leaf size={20}/></div>
            </div>
            <h3 className="text-3xl font-black text-emerald-600">{ecoPercentage}%</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">({ecoTrips} เที่ยว) EV, รถตู้, นั่งร่วมกัน</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-bold text-slate-500">ค่าเฉลี่ยคาร์บอน</p>
              <div className="p-2 bg-purple-50 text-purple-500 rounded-xl"><Zap size={20}/></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{avgCarbonPerTrip}</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">kgCO2e / เที่ยว</p>
          </div>
        </div>

        {/* ================= Charts Section ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* กราฟโดนัท (ฝั่งซ้าย) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-1">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <PieChart className="text-blue-500" size={20} /> สัดส่วนพาหนะ (%)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} 
                    paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomizedLabel}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} เที่ยว`, 'จำนวน']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* กราฟแนวโน้ม (ฝั่งขวา) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingDown className="text-emerald-500" size={20} /> แนวโน้มการปล่อยคาร์บอน (Trend)
            </h2>
            <div className="h-64">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [`${value} kgCO2e`, 'ปริมาณคาร์บอน']}
                    />
                    <Area type="monotone" dataKey="carbon" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCarbon)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 font-bold">ไม่มีข้อมูลในสัดส่วนนี้</div>
              )}
            </div>
          </div>

        </div>

        {/* ================= Table Section ================= */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6">บันทึกการเดินทาง (Filtered Data)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                  <th className="p-4 font-bold text-slate-500 rounded-tl-xl">วันที่</th>
                  <th className="p-4 font-bold text-slate-500">พาหนะ</th>
                  <th className="p-4 font-bold text-slate-500">รายละเอียด</th>
                  <th className="p-4 font-black text-slate-700 text-right rounded-tr-xl">คาร์บอน (kgCO2e)</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((r, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-4 text-sm font-medium text-slate-600">
                        {new Date(r.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-800 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${r.transportType === 'รถยนต์ส่วนตัว' ? 'bg-blue-500' : r.transportType === 'รถรับส่งบริษัท' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {r.transportType}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {r.transportType === 'รถรับส่งบริษัท' ? `สาย: ${r.vanRouteName}` : `${r.distance} กม. (${r.fuelType})`}
                      </td>
                      <td className="p-4 text-sm font-black text-red-500 text-right">
                        {r.carbonEmission ? r.carbonEmission.toFixed(3) : '0.000'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400 font-bold">ไม่พบข้อมูลในช่วงเวลาที่เลือก</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}