import express from 'express';
import VanRoute from '../models/VanRoute.js';

const router = express.Router();

// 📥 POST: เพิ่มสายรถตู้ใหม่
router.post('/', async (req, res) => {
  try {
    const newRoute = new VanRoute(req.body);
    const savedRoute = await newRoute.save();
    res.status(201).json({ success: true, data: savedRoute });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// 📤 GET: ดึงรายชื่อสายรถตู้ทั้งหมดมาทำ Dropdown
router.get('/', async (req, res) => {
  try {
    const routes = await VanRoute.find({ isActive: true });
    res.status(200).json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;