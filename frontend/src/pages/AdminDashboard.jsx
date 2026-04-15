import React, { useState, useEffect } from 'react';
import { Database, PlusCircle, Save, Activity } from 'lucide-react';

export default function AdminDashboard() {
  // 1. สร้าง State สำหรับเก็บข้อมูล
  const [factors, setFactors] = useState([]); // เก็บรายการ EF ทั้งหมด
  const [loading, setLoading] = useState(true); // สถานะกำลังโหลด
  const [message, setMessage] = useState(''); // ข้อความแจ้งเตือน

  // State สำหรับฟอร์มเพิ่มข้อมูล
  const [formData, setFormData] = useState({
    transportType: 'รถยนต์ส่วนตัว',
    fuelType: 'เบนซิน',
    efValue: '',
    unit: 'kgCO2e/km'
  });

  // 2. ฟังก์ชันดึงข้อมูลจาก Backend (ดึงทันทีที่เปิดหน้านี้)
  const fetchFactors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/emission-factors');
      const result = await response.json();
      if (result.success) {
        setFactors(result.data);
      }
    } catch (error) {
      console.error('ดึงข้อมูลล้มเหลว:', error);
    } finally {
      setLoading(false);
    }
  };

  // เรียกใช้ fetchFactors ครั้งแรกตอนเปิดหน้าเว็บ
  useEffect(() => {
    fetchFactors();
  }, []);

  // 3. ฟังก์ชันจัดการเมื่อพิมพ์ข้อมูลในฟอร์ม
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 4. ฟังก์ชันบันทึกข้อมูล (POST ไปยัง Backend)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('กำลังบันทึก...');
    
    try {
      const response = await fetch('http://localhost:5000/api/emission-factors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          efValue: Number(formData.efValue) // แปลงเป็นตัวเลขก่อนส่ง
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('✅ บันทึกข้อมูลสำเร็จ!');
        setFormData({ ...formData, efValue: '' }); // ล้างช่องตัวเลข
        fetchFactors(); // โหลดตารางใหม่เพื่อให้ข้อมูลอัปเดตทันที
        
        // ลบข้อความแจ้งเตือนหลังผ่านไป 3 วินาที
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  // 5. ส่วนแสดงผล UI
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <Database className="text-blue-600" />
          ระบบจัดการฐานข้อมูล (Admin Dashboard)
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* คอลัมน์ซ้าย: ฟอร์มเพิ่มข้อมูล */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 h-fit">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-green-700">
              <PlusCircle size={20} /> เพิ่ม/แก้ไข ค่า EF
            </h2>

            {message && (
              <div className="mb-4 p-2 text-sm text-center rounded bg-green-100 text-green-800">
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทพาหนะ</label>
                <select 
                  name="transportType" 
                  value={formData.transportType} 
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="รถยนต์ส่วนตัว">รถยนต์ส่วนตัว</option>
                  <option value="รถจักรยานยนต์">รถจักรยานยนต์</option>
                  <option value="รถโดยสารประจำทาง">รถโดยสารประจำทาง</option>
                  <option value="รถไฟ/รถไฟฟ้า">รถไฟ/รถไฟฟ้า</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทเชื้อเพลิง</label>
                <select 
                  name="fuelType" 
                  value={formData.fuelType} 
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="เบนซิน">เบนซิน</option>
                  <option value="ดีเซล">ดีเซล</option>
                  <option value="EV">EV (ไฟฟ้า)</option>
                  <option value="N/A">ไม่มี/ไม่ระบุ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ค่า EF (ตัวเลข)</label>
                <input 
                  type="number" 
                  step="0.0001" // อนุญาตให้ใส่ทศนิยมได้ 4 ตำแหน่ง
                  name="efValue" 
                  value={formData.efValue} 
                  onChange={handleChange}
                  placeholder="เช่น 2.189"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Save size={18} /> บันทึกข้อมูล
              </button>
            </form>
          </div>

          {/* คอลัมน์ขวา: ตารางแสดงข้อมูล */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
              <Activity size={20} className="text-blue-500" /> ตาราง Emission Factors (อ้างอิง TGO)
            </h2>
            
            {loading ? (
              <p className="text-center text-gray-500 py-8">กำลังโหลดข้อมูล...</p>
            ) : factors.length === 0 ? (
              <p className="text-center text-gray-500 py-8">ยังไม่มีข้อมูลในระบบ กรุณาเพิ่มข้อมูลด้านซ้ายมือ</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="p-3 text-sm font-medium text-gray-600">พาหนะ</th>
                      <th className="p-3 text-sm font-medium text-gray-600">เชื้อเพลิง</th>
                      <th className="p-3 text-sm font-medium text-gray-600">ค่า EF</th>
                      <th className="p-3 text-sm font-medium text-gray-600">หน่วย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factors.map((factor) => (
                      <tr key={factor._id} className="border-b hover:bg-gray-50 transition">
                        <td className="p-3 text-sm text-gray-800">{factor.transportType}</td>
                        <td className="p-3 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            factor.fuelType === 'EV' ? 'bg-blue-100 text-blue-700' : 
                            factor.fuelType === 'เบนซิน' ? 'bg-orange-100 text-orange-700' : 
                            factor.fuelType === 'ดีเซล' ? 'bg-red-100 text-red-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {factor.fuelType}
                          </span>
                        </td>
                        <td className="p-3 text-sm font-semibold text-gray-800">{factor.efValue}</td>
                        <td className="p-3 text-sm text-gray-500">{factor.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}