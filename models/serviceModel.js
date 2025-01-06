import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    speciality: { type: String},
    amount : { type: String},
    image : { type: String},
    
});

const serviceModel = mongoose.models.service || mongoose.model('Service', serviceSchema);

export default serviceModel;