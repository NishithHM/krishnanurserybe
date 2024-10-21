
const Cart = require('../models/cart.model');
const Billing = require('../models/billings.model');
const PlantInfo = require('../models/plant_info.model'); 

exports.approvecart = async (req, res) => {
    const { uuid } = req.params;

    if (!req.token || !req.token.role) {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    try {
       
        const cart = await Cart.findOne({ uuid, status: 'placed' });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found or already approved' });
        }

        let isValidQuantity = true;
        for (let item of cart.items) {
          
            const plant = await PlantInfo.findById(item.plantId);
            if (!plant) {
                isValidQuantity = false;
                break;
            }

       
            if (item.qty > plant.availableQuantity) {
                isValidQuantity = false;
                break;
            }
        }

        if (!isValidQuantity) {
            return res.status(400).json({ message: 'Invalid quantity for one or more items' });
        }
       

     
        cart.status = 'approved';

        const billingData = {
            invoiceId: `O_N_L_0_${cart.uuid}`,
            customerName: cart.name,
            customerNumber: cart.phoneNumber,
            procurementId: cart.procurementId,
            procurementName: cart.procurementName,
            totalPrice: cart.totalAmount,
            discount: cart.totalDiscount,
            soldBy: {
                _id: req?.token?.id,
                name: req?.token?.name,
            }, 
            billingDate: new Date(),
            items: cart.items, 
        };

        const billingEntry = new Billing(billingData);
        await billingEntry.save();

        await cart.save();

        return res.status(200).json({ message: 'Cart approved and billing entry created', billingEntry });
    } catch (error) {
        console.error('Error in approvecart:', error); 
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
