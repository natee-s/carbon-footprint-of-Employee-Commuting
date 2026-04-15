import mongoose from 'mongoose';

// 1. สร้างแม่พิมพ์ (Schema) กำหนดโครงสร้างข้อมูล
const carbonRecordSchema = new mongoose.Schema({
  activityType: {
    type: String,
    required: true,
    enum: [
      'Employee Commuting', // การเดินทางมาทำงานของพนักงาน (Category 7)
      'Business Travel'     // การเดินทางเพื่อธุรกิจ (Category 6)
    ]
  },
  transportType: {
    type: String,
    required: true,
  
  },
  
  // --- ส่วนขยายเพิ่มเติมสำหรับ Logic การคำนวณ ---
  fuelType: { 
    type: String,
    default: 'N/A' // สำหรับระบุ เบนซิน/ดีเซล/EV
  },
  carPoolRole: { 
    type: String,
    enum: ['Driver', 'Passenger', 'N/A'],
    default: 'N/A' // ระบุว่าเป็นคนขับ หรือคนนั่งอาศัยมา
  },
  occupancy: { 
    type: Number,
    default: 1, // จำนวนคนบนรถ เอาไว้เป็นตัวหารเฉลี่ยคาร์บอน
    min: 1
  },
  vanRouteName: {
    type: String,
    default: 'N/A' // กรณีเลือกรถรับส่งบริษัท จะเก็บชื่อสายรถไว้ที่นี่
  },
  // ----------------------------------------

  distance: {
    type: Number,
    required: true,
    min: 0
  },
  carbonEmission: {
    type: Number,
    required: true,
    min: 0,  // ดักจับข้อมูลผิดพลาด
  },

  leg: {
    type: String,
    enum: ['ขามาทำงาน', 'ขากลับบ้าน'], // แยกชัดเจนว่าเป็นทริปขาไหน
    default: 'ขามาทำงาน'
  },

  date: {
    type: Date,
    default: Date.now // ถ้าตอนบันทึกไม่ได้ใส่วันที่มา ให้ใช้วัน-เวลาปัจจุบันอัตโนมัติ
  }
}, {
  timestamps: true // ให้ Mongoose ช่วยสร้างช่อง createdAt (วันที่สร้าง) และ updatedAt (วันที่แก้ไขล่าสุด) ให้เราอัตโนมัติ
});

// 2. แปลงแม่พิมพ์ให้เป็น Model (พร้อมใช้งาน) แล้ว Export ออกไปให้ไฟล์อื่นเรียกใช้
export default mongoose.model('CarbonRecord', carbonRecordSchema);