import express from 'express';
import VanRoute from '../models/VanRoute.js';

const router = express.Router();

// 📤 GET: ดึงรายชื่อสายรถตู้ทั้งหมด 
router.get('/', async (req, res) => {
  try {
    const routes = await VanRoute.find({ isActive: true });
    res.status(200).json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 📥 POST: เพิ่มหรืออัปเดตสายรถตู้ (ใช้ชื่อสายรถเป็นเกณฑ์)
router.post('/', async (req, res) => {
  try {
    const { routeName } = req.body;
    
    // ใช้ findOneAndUpdate เพื่อเช็คชื่อสายรถ ถ้ามีอยู่แล้วให้ Update ถ้าไม่มีให้ Create (upsert)
    const updatedRoute = await VanRoute.findOneAndUpdate(
      { routeName: routeName }, // ค้นหาด้วยชื่อสายรถ
      req.body,                 // ข้อมูลที่จะบันทึก/อัปเดต
      { new: true, upsert: true } // upsert: true คือหัวใจของการแก้ปัญหานี้ครับ
    );

    res.status(201).json({ success: true, data: updatedRoute });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 🗑️ DELETE: ลบสายรถตู้
router.delete('/:id', async (req, res) => {
  try {
    await VanRoute.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'ลบสายรถสำเร็จ' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;