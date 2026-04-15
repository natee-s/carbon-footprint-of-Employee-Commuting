import mongoose from 'mongoose';

const vanRouteSchema = new mongoose.Schema({
  routeName: { 
    type: String, 
    required: [true, 'กรุณาระบุชื่อสายรถรับส่ง'],
    trim: true
  },
  distance: { 
    type: Number, 
    required: [true, 'กรุณาระบุระยะทางรวมของสายนี้ (กม.)'],
    min: 0
  },
  passengerCount: { 
    type: Number, 
    required: [true, 'กรุณาระบุจำนวนผู้โดยสารเฉลี่ย'],
    min: 1,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true // เผื่ออนาคตบริษัทเลิกจ้างสายนี้ ก็กดปิดได้
  }
}, { timestamps: true });

export default mongoose.model('VanRoute', vanRouteSchema);