
const Cart = require('../models/cart.model');
const PlantInfo = require('../models/plant_info.model');
const Offer = require('../models/offers.models');
const crypto = require('crypto');

// Add or update cart function
exports.addToCart = async (req, res) => {
    try {
        const { cart, uuid, offerId } = req.body;

        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ message: 'Cart must be a non-empty array' });
        }

        // Fetch plant details
        const plantIds = cart.map(item => item.plantId);
        const plants = await PlantInfo.find({
            _id: { $in: plantIds },
            status: 'PUBLISH',
            isActive: true,
        });

        if (plants.length !== cart.length) {
            return res.status(404).json({ message: 'Some plants are invalid or inactive' });
        }

        // Cart items
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

        // Calculate total amount
        let totalAmount = cartItems.reduce((total, item) => total + item.discountedPrice * item.qty, 0);

        let cartData;
        if (!uuid) {
            // Create a new cart
            cartData = new Cart({
                items: cartItems,
                totalAmount,
                uuid: crypto.randomUUID(), // Generate UUID
                status: 'cart', // initial status to cart
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

        // Apply offer if it is there
        let errorMessage = '';

        if (offerId) {
            const offer = await Offer.findById(offerId);

            if (!offer) {
                errorMessage = 'Offer not found';
            } else if (!offer.isActive) {
                errorMessage = 'Offer is not active';
            } else {
                const offerPlantIds = offer.plants.map(plant => plant._id.toString());

                const eligibleForOffer = cartItems.every(item => offerPlantIds.includes(item.plantId.toString()));

                if (!eligibleForOffer) {
                    errorMessage = 'Some cart items are not eligible for the applied offer';
                } else {
                    let applicable = false;

                    // Check if cart meets offer requirements
                    if (offer.ordersAbove && totalAmount >= offer.ordersAbove && cartItems.length >= offer.minPurchaseQty) {
                        applicable = true;
                    }

                    if (!applicable) {
                        errorMessage = `Cart does not meet the minimum purchase amount for this offer. OrdersAbove: ${offer.ordersAbove}`;
                    }

                    // Calculate the discount
                    if (!errorMessage) {
                        const percentageDiscount = (totalAmount * offer.percentageOff) / 100;
                        const offerDiscount = Math.min(percentageDiscount, offer.upto);

                        // Update the cart : - by  discount and totalAmount
                        cartData.offerDiscount = offerDiscount;
                        cartData.totalDiscount = (cartData.totalDiscount || 0) + offerDiscount;
                        cartData.totalAmount -= offerDiscount;
                    }
                }
            }
        }

        const savedCart = await cartData.save();

        return res.status(200).json({
            message: 'Cart updated successfully',
            cart: {
                totalAmount: savedCart.totalAmount,
                totalDiscount: savedCart.totalDiscount,
                offerDiscount: savedCart.offerDiscount,
                items: savedCart.items,
                uuid: savedCart.uuid,
                status: savedCart.status 
            },
            errorMessage, 
        });

    } catch (error) {
        console.error('Error in addToCart:', error.message);
        return res.status(500).json({ message: 'Error updating cart', error: error.message });
    }
};
// Checkout Cart function
exports.checkoutCart = async (req, res) => {
    try {
        const { uuid, customer } = req.body; // Retrieve  :- UUID and customer details

        // Validate :-  UUID & customer 
        if (!uuid) {
            return res.status(400).json({ message: 'We need a UUID to process your checkout.' });
        }
        if (!customer || typeof customer !== 'object') {
            return res.status(400).json({ message: 'Please provide your customer details for checkout.' });
        }

        
        const { name, phone, pinCode, address, locality, state, city, landmark, alternateMobileNumber } = customer;
        if (!name || !phone || !pinCode || !address || !locality || !state || !city) {
            return res.status(400).json({ message: 'customer details are missing. Please provide all required fields.' });
        }

      
        const pinCodeAsNumber = Number(pinCode);//number

        const cart = await Cart.findOne({ uuid });

        // Check if cart exists
        if (!cart) {
            return res.status(404).json({ message: "We couldn't find your cart. Please check the UUID." });
        }

        // Update cart 
        cart.customer = {
            name,
            phone,
            pinCode: pinCodeAsNumber, 
            address,
            locality,
            state,
            city,
            landmark, // optional
            alternateMobileNumber // optional
        };
        cart.status = 'placed'; 

        // Checkout details
        cart.checkoutDetails = {
            items: cart.items.map(item => ({ 
                plantId: item._id, 
                name: item.name, 
                quantity: item.quantity 
            })),
            totalAmount: cart.totalAmount,
            totalDiscount: cart.totalDiscount,
            finalAmount: cart.totalAmount - cart.totalDiscount,
        };

        // Save the updated cart
        const updatedCart = await cart.save();

        return res.status(200).json({
            message: "Thank you for your order! Your checkout was successful.",
            cart: updatedCart // Return cart
        });
    } catch (error) {
        console.error("Error in checkoutCart:", error);
        return res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
};



// Get Cart by UUID Function
exports.getCartByUuid = async (req, res) => {
    try {
        const { uuid } = req.params; // Take UUID 

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
