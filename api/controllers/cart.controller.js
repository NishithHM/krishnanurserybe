

const Cart = require('../models/cart.model');
const PlantInfo = require('../models/plant_info.model');
const Customer = require('../models/customer.model');
const Offer = require('../models/offers.models');
const crypto = require('crypto');

exports.addToCart = async (req, res) => {
    try {
        const { cart, uuid, offerId, customerId } = req.body;

        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ message: 'Cart must be a non-empty array' });
        }

        //  plant details
        const plantIds = cart.map(item => item.plantId);
        const plants = await PlantInfo.find({
            _id: { $in: plantIds },
            status: 'PUBLISH',
            isActive: true,
        });

        if (plants.length !== cart.length) {
            return res.status(404).json({ message: 'Some plants are invalid or inactive' });
        }

        let customerName = '';
      
        if (customerId) {
            const customer = await Customer.findById(customerId);
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found' });
            }
            // customerName = customer.names.customer.name;
        }

        // Prepare cart items
        const cartItems = cart.map(item => {
            const plant = plants.find(p => p._id.toString() === item.plantId.toString());
            if (!plant) {
                throw new Error(`Plant with ID ${item.plantId} not found`);
            }
            return {
                plantId: plant._id,
                name: plant.names,
                price: plant.sellingPrice,
                discountedPrice: plant.discountedSellingPrice || plant.sellingPrice,
                qty: item.qty,
                tips: plant.tips.join(', '),
                moreInfo: plant.moreInfo,
                tags: plant.tags.map(tag => tag.name),
            };
        });

        // Calci
        let totalAmount = cartItems.reduce((total, item) => total + item.discountedPrice * item.qty, 0);

        let cartData;
        if (!uuid) {
            // Create a new cart 
            cartData = new Cart({
                items: cartItems,
                totalAmount,
                uuid: crypto.randomUUID(), // Generate UUID
            });
        } else {
            // If UUID exists, update the cart
            cartData = await Cart.findOneAndUpdate(
                { uuid },
                { items: cartItems, totalAmount },
                { new: false } 
            );

            if (!cartData) {
                return res.status(404).json({ message: 'Cart not found' });
            }
        }

        //  offer if offerId is there
        if (offerId) {
            const offer = await Offer.findById(offerId);

            if (!offer) {
                return res.status(404).json({ message: 'Offer not found' });
            }

            // Check if offer is active or  not
            if (!offer.isActive) {
                return res.status(400).json({ message: 'Offer is not active' });
            }

            // Check if the offer is applicable to set of the array client
            const isClient = offer.clients.includes(customerId); // clientId  frome : --------
            if (!isClient) {
                return res.status(403).json({ message: 'Offer not applicable for this client' });
            }

            // Check  cart total value is more than 200 
            if (totalAmount < 200) {
                return res.status(400).json({ message: 'Cart value must be greater than 200 to apply the offer' });
            }

            // Calculate 
            const percentageDiscount = (totalAmount * offer.discountPercentage) / 100;

            // 
            const offerDiscount = percentageDiscount > offer.maxDiscount ? offer.maxDiscount : percentageDiscount;

            // Update the cart's discount and total payable amount
            cartData.offerDiscount = offerDiscount;
            cartData.totalDiscount = (cartData.totalDiscount || 0) + offerDiscount;
            cartData.totalAmount -= offerDiscount;
        }

        // Save the updated cart
        const savedCart = await cartData.save();
        return res.status(200).json({
            message: 'Cart updated successfully',
            cart: {
                totalAmount: savedCart.totalAmount,
                totalDiscount: savedCart.totalDiscount,
                offerDiscount: savedCart.offerDiscount,
                items: savedCart.items,
                uuid: savedCart.uuid,
            },
        });

    } catch (error) {
        console.error('Error in addToCart:', error.message);
        return res.status(500).json({ message: 'Error updating cart', error: error.message });
    }
};

// Get Cart by UUID Function
exports.getCartByUuid = async (req, res) => {
    try {
        const { uuid } = req.params; // take UUID 

        // Fetch the cart by UUID
        const cart = await Cart.findOne({ uuid });

        // Check if cart exists
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Return the cart details
        return res.status(200).json({
            message: "Cart retrieved successfully",
            cart,
        });
    } catch (error) {
        console.error("Error retrieving cart:", error);
        return res.status(500).json({ message: "Server error" });
    }
};