import serviceModel from '../models/serviceModel.js';



// Obtenir tous les services avec leurs sous-services
const serviceList = async (req, res) => {
    try {
        const services = await serviceModel.find({});
        res.json({success: true, services});
    } catch (error) {
        res.json({success: false, message: error.message });
    }
};


export default {
    serviceList,
  };