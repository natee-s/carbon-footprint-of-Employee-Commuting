import mongoose from 'mongoose'

const emissionFactorSchema = new mongoose.Schema({

    transportType:{
        type: String,
        required:[true, 'กรุฯาระบุประเภทพาหนะ']
    },
    fuelType:{
        type: String,
        required: [true,'กรุณาระบุค่า EF'],
        default: 'N/A'
    },
    efValue: { 
        type: Number, 
        required: [true, 'กรุณาระบุค่า EF'] 
    },
    unit:{
        type: String,
        default: 'kgCO2e/km'
    },
    soure:{
        type: String,
        default: 'TGO2023'
    },
    isActive:{
        type:Boolean,
        default: true
    }   
},{timestamp: true});

export default mongoose.model('EmissionFactor', emissionFactorSchema);