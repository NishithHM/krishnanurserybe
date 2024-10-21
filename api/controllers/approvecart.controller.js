
// const Cart = require('../models/cart.model');
// const Billing = require('../models/billings.model');
// const PlantInfo = require('../models/plant_info.model'); 

// exports.approvecart = async (req, res) => {
//     const { uuid } = req.params;

//     if (!req.token || !req.token.role) {
//         return res.status(403).json({ message: 'Unauthorized access' });
//     }

//     try {
       
//         const cart = await Cart.findOne({ uuid, status: 'placed' });
//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found or already approved' });
//         }

//         let isValidQuantity = true;
//         for (let item of cart.items) {
          
//             const plant = await PlantInfo.findById(item.plantId);
//             if (!plant) {
//                 isValidQuantity = false;
//                 break;
//             }

       
//             if (item.qty > plant.availableQuantity) {
//                 isValidQuantity = false;
//                 break;
//             }
//         }

//         if (!isValidQuantity) {
//             return res.status(400).json({ message: 'Invalid quantity for one or more items' });
//         }
       

//         // Update the cart status to 'approved'
//         cart.status = 'approved';

//         // Create a new billing entry
//         const billingData = {
//             invoiceId: `O_N_L_0_${cart.uuid}`,
//             customerName: cart.name,
//             customerNumber: cart.phoneNumber,
//             procurementId: cart.procurementId,
//             procurementName: cart.procurementName,
//             totalPrice: cart.totalAmount,
//             discount: cart.totalDiscount,
//             soldBy: {
//                 _id: req?.token?.id,
//                 name: req?.token?.name,
//             }, // Assuming soldBy is from the token (admin/sales)
//             billingDate: new Date(),
//             items: cart.items, // Ensure this structure is correct
//         };

//         const billingEntry = new Billing(billingData);
//         await billingEntry.save();

//         // Save the updated cart status
//         await cart.save();

//         return res.status(200).json({ message: 'Cart approved and billing entry created', billingEntry });
//     } catch (error) {
//         console.error('Error in approvecart:', error); // Log the full error
//         return res.status(500).json({ message: 'Internal server error', error: error.message });
//     }
// };
const { cart: Cart } = require('../models/cart.model'); // Assuming you export Cart as 'cart'
const Billing = require('../models/billings.model');
const PlantInfo = require('../models/plant_info.model');

exports.approvecart = async (req, res) => {
    const { uuid } = req.params;

    // if (!req.token || !req.token.role) {
    //     return res.status(403).json({ message: 'Unauthorized access' });
    // }

    try {
        // Fetch the cart using the provided uuid
        const savedCart = await Cart.findOne({ uuid, status: 'placed' }); // Ensure 'Cart' is used here
        if (!savedCart) {
            return res.status(404).json({ message: 'Cart not found or already approved' });
        }

        // Validate item quantities against available plant quantities
        let isValidQuantity = true;
        for (let item of savedCart.items) {
            const plant = await PlantInfo.findById(item.plantId); // Adjust if plantId is not being used correctly
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

        // Update the cart status
        savedCart.status = 'approved';

        // Prepare billing data
        const billingData = {
            invoiceId: `O_N_L_0_${savedCart.uuid}`,
            customerName: savedCart.name,
            customerNumber: savedCart.phoneNumber,
            procurementId: savedCart.procurementId,
            procurementName: savedCart.procurementName,
            totalPrice: savedCart.totalAmount,
            discount: savedCart.totalDiscount,
            soldBy: {
                name: req?.token?.name, // Using name instead of id
            },
            billingDate: new Date(),
            items: savedCart.items,
        };

        // Create a new billing entry
        const billingEntry = new Billing(billingData);
        await billingEntry.save();

        // Save the updated cart
        await savedCart.save(); // Save the updated cart status

        return res.status(200).json({ message: 'Cart approved and billing entry created', billingEntry });
    } catch (error) {
        console.error('Error in approvecart:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
