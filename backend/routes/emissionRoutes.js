import express from 'express';
import EmissionFactor from '../models/EmissionFactor.js';

const router = express.Router();

// 📥 POST: เพิ่มหรืออัปเดตค่า EF
router.post('/', async (req, res) => {
  try {
    const { transportType, fuelType, efValue } = req.body;
    
    // ใช้ฟังก์ชัน findOneAndUpdate เพื่อให้ถ้ามีประเภทพาหนะเดิมอยู่แล้ว ให้ทับค่าเดิมไปเลย (Upsert)
    const factor = await EmissionFactor.findOneAndUpdate(
      { transportType, fuelType },
      req.body,
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, data: factor });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 📤 GET: ดึงค่า EF ทั้งหมดไปใช้คำนวณที่หน้าบ้าน
router.get('/', async (req, res) => {
  try {
    const factors = await EmissionFactor.find({ isActive: true });
    res.status(200).json({ success: true, data: factors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;