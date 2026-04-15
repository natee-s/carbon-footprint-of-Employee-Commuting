import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import carbonRoutes from './routes/carbonRoutes.js';
import emissionRoutes from './routes/emissionRoutes.js'; 
import vanRoutes from './routes/vanRoutes.js';

//เรียกใช้ตู้เซฟ .env
dotenv.config();

// 1. สร้างตัวแอปพลิเคชันขึ้นมา
const app = express();

// 2. ตั้งค่าให้แอปเปิดรับข้อมูล --> Middleware (สายพานเตรียมข้อมูล)
app.use(cors()); // อนุญาตให้หน้าเว็บ (Frontend) ข้ามมาคุยกับหลังบ้านได้
app.use(express.json()); // อนุญาตให้ระบบอ่านและเขียนข้อมูลแบบ JSON ได้
app.use('/api/carbon', carbonRoutes);
app.use('/api/emission-factors', emissionRoutes); // 🆕 เสียบปลั๊กท่อ EF
app.use('/api/van-routes', vanRoutes);           // 🆕 เสียบปลั๊กท่อสายรถตู้



// 3. ไปหยิบกุญแจและพอร์ตมาจากตู้เซฟ--เชื่อมต่อฐานข้อมูล
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// 4. สั่งให้ Mongoose เอากุญแจไปไขประตูเชื่อมกับ MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    // ถ้ากุญแจถูกต้องและเชื่อมต่อสำเร็จ จะพิมพ์ข้อความนี้
    console.log('✅ เชื่อมต่อฐานข้อมูล MongoDB สำเร็จ!');
  })
  .catch((err) => {
    // ถ้าเชื่อมต่อไม่สำเร็จ (เช่น รหัสผิด หรือเน็ตหลุด) จะพิมพ์ข้อความนี้
    console.log('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ MongoDB:', err);
  });

// API Routes (วางตรงนี้ครับ!)
// นี่คือการบอกว่า "ถ้ามี Request มาที่ /api/carbon ให้ส่งต่อไปที่ท่อ carbonRoutes นะ"
app.use('/api/carbon', carbonRoutes);

// 5. สร้างเส้นทางทดสอบ (Route) เมื่อมีคนเปิดหน้าเว็บเข้ามา
app.get('/', (req, res) => {
  res.send('🌿 TGO Carbon Tracker API is running...');
});

// 6. สั่งให้ Server สตาร์ทเครื่องและรอรับคำสั่ง
app.listen(PORT, () => {
  console.log(`🚀 Server เปิดทำงานแล้วที่ Port ${PORT}`);
});