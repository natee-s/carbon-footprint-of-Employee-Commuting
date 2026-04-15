import mongoose from 'mongoose';
import CarbonRecord from './models/CarbonRecord.js';
import EmissionFactor from './models/EmissionFactor.js';
import VanRoute from './models/VanRoute.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🌱 เริ่มต้นการจำลองข้อมูล กรุณารอสักครู่...");

    // 1. ล้างข้อมูลเก่า
    await CarbonRecord.deleteMany({});
    await EmissionFactor.deleteMany({});
    await VanRoute.deleteMany({});
    
    // 2. สร้างค่า EF
    const efData = [
      { transportType: 'รถยนต์ส่วนตัว', fuelType: 'เบนซิน', efValue: 0.174 },
      { transportType: 'รถยนต์ส่วนตัว', fuelType: 'ดีเซล', efValue: 0.210 },
      { transportType: 'รถยนต์ส่วนตัว', fuelType: 'EV', efValue: 0.080 },
      { transportType: 'รถจักรยานยนต์', fuelType: 'เบนซิน', efValue: 0.045 },
      { transportType: 'รถรับส่งบริษัท', fuelType: 'ดีเซล', efValue: 0.263 },
      { transportType: 'รถโดยสารสาธารณะ', fuelType: 'N/A', efValue: 0.050 }
    ];
    await EmissionFactor.insertMany(efData);

    // 3. สร้างสายรถตู้ 8 สาย
    const routes = [];
    for (let char of 'ABCDEFGH') {
      routes.push({
        routeName: `สาย ${char}`,
        distance: Math.floor(Math.random() * (60 - 20) + 20),
        passengerCount: Math.floor(Math.random() * (15 - 8) + 8)
      });
    }
    const savedRoutes = await VanRoute.insertMany(routes);

    // 4. จำลองข้อมูลพนักงาน 100 คน ช่วง ม.ค. - มี.ค. 2569
    const records = [];
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-03-31');

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue; // ข้ามวันเสาร์-อาทิตย์

      for (let i = 1; i <= 100; i++) { // พนักงาน 100 คน
        const rand = Math.random();
        let transport, fuel, dist, occupancy, vanName, ef;

        if (rand < 0.5) { 
          const r = savedRoutes[Math.floor(Math.random() * 8)];
          transport = 'รถรับส่งบริษัท';
          vanName = r.routeName;
          dist = r.distance;
          ef = 0.263;
          occupancy = r.passengerCount;
        } else if (rand < 0.7) { 
          transport = 'รถยนต์ส่วนตัว';
          fuel = Math.random() > 0.3 ? 'เบนซิน' : 'EV';
          dist = Math.floor(Math.random() * 30) + 5;
          ef = fuel === 'EV' ? 0.080 : 0.174;
          occupancy = 1;
        } else if (rand < 0.9) { 
          transport = 'รถจักรยานยนต์';
          fuel = 'เบนซิน';
          dist = Math.floor(Math.random() * 10) + 2;
          ef = 0.045;
          occupancy = 1;
        } else { 
          transport = 'รถโดยสารสาธารณะ';
          dist = Math.floor(Math.random() * 40) + 10;
          ef = 0.050;
          occupancy = 1;
        }

        const emission = (dist * ef) / occupancy;
        
        // เติม activityType: 'Employee Commuting' ลงไปทั้งขามาและขากลับ
        records.push({ 
          activityType: 'Employee Commuting', 
          transportType: transport, 
          fuelType: fuel || 'N/A', 
          vanRouteName: vanName, 
          distance: dist, 
          occupancy, 
          carbonEmission: emission, 
          leg: 'ขามาทำงาน', 
          createdAt: new Date(d) 
        });
        
        records.push({ 
          activityType: 'Employee Commuting', 
          transportType: transport, 
          fuelType: fuel || 'N/A', 
          vanRouteName: vanName, 
          distance: dist, 
          occupancy, 
          carbonEmission: emission, 
          leg: 'ขากลับบ้าน', 
          createdAt: new Date(d) 
        });
      }
    }

    await CarbonRecord.insertMany(records);
    console.log(`✅ สำเร็จ! จำลองข้อมูลเสร็จเรียบร้อย จำนวน ${records.length} ทริป`);
    process.exit();
  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาด:", err);
    process.exit(1);
  }
};

seedData();