import express from 'express';
import CarbonRecord from '../models/CarbonRecord.js';

const router = express.Router();

// 📤 GET: ดึงข้อมูลประวัติการเดินทางทั้งหมด (สำหรับทำ Dashboard)
router.get('/', async (req, res) => {
  try {
    // ดึงข้อมูลทั้งหมด และเรียงจากล่าสุดไปเก่าสุด
    const records = await CarbonRecord.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 📥 ท่อที่ 1: รับข้อมูลใหม่เข้ามาบันทึก (CREATE)
// Method: POST | URL: /api/carbon
// ==========================================
router.post('/', async (req, res) => {
  try {
    // 1. req.body คือ "กล่องพัสดุ" ที่หน้าบ้านส่งข้อมูลมาให้เรา
    const dataFromFrontend = req.body; 

    // 2. เอาข้อมูลเทใส่แม่พิมพ์
    const newRecord = new CarbonRecord(dataFromFrontend);

    // 3. สั่งประทับตราและบันทึกลงฐานข้อมูล MongoDB
    const savedRecord = await newRecord.save();

    // 4. ส่งข้อความกลับไปบอกหน้าบ้านว่า "บันทึกสำเร็จนะ!" (Status 201 คือ Created)
    res.status(201).json({
      success: true,
      message: 'บันทึกข้อมูลคาร์บอนฟุตพริ้นท์สำเร็จ!',
      data: savedRecord
    });

  } catch (error) {
    // ถ้าข้อมูลไม่ตรงกับแม่พิมพ์ (เช่น ลืมใส่ระยะทาง) มันจะเด้งมาตรงนี้
    res.status(400).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      error: error.message
    });
  }
});

// ==========================================
// 📤 ท่อที่ 2: ดึงข้อมูลทั้งหมดไปแสดงผล (READ)
// Method: GET | URL: /api/carbon
// ==========================================
router.get('/', async (req, res) => {
  try {
    // 1. สั่งให้ไปหาข้อมูลทั้งหมดในโกดัง (.sort({ createdAt: -1 }) คือให้เรียงจากใหม่ล่าสุดไปเก่าสุด)
    const records = await CarbonRecord.find().sort({ createdAt: -1 });

    // 2. ส่งข้อมูลกลับไปให้หน้าบ้าน
    res.status(200).json({
      success: true,
      count: records.length, // บอกด้วยว่ามีกี่รายการ
      data: records
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลได้',
      error: error.message
    });
  }
});

// 3. 🗑️ DELETE: ลบข้อมูลการเดินทาง (ส่วนที่คุณแมนถามถึง แทรกอยู่ตรงนี้ครับ!)
router.delete('/:id', async (req, res) => {
  try {
    await CarbonRecord.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


export default router; // ส่งท่อนี้ออกไปให้ไฟล์อื่นใช้งาน