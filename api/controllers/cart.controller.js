// const mongoose = require('mongoose');
const Cart = require('../models/cart.model');
const PlantInfo = require('../models/plant_info.model');
const Customer = require('../models/customer.model');
const Offer = require('../models/offers.models');
const crypto = require('crypto');

// Add or update the cart
exports.addToCart = async (req, res) => {
  try {
    const { cart, couponCode, uuid, offerId, customerId } = req.body;

    // Validate the request body
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: 'Cart must be a non-empty array' });
    }

    // Validate plant existence in the database
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
    // Fetch the customer name if customerId is provided
    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      customerName = customer.names.customer.name; // Ensure this matches your Customer schema
    }

    // Map cart items with proper plant data
    const cartItems = cart.map(item => {
      const plant = plants.find(p => p._id.toString() === item.plantId.toString());

      if (!plant) {
        throw new Error(`Plant with ID ${item.plantId} not found`);
      }

      return {
        plantId: plant._id,
        name: plant.names.en.name || plant.names.ka.name, // Pick plant name
        customerName: customerName || null, // Include customerName if available
        price: plant.sellingPrice,
        discountedPrice: plant.discountedSellingPrice || plant.sellingPrice,
        qty: item.qty,
        tips: plant.tips.join(', '),
        moreInfo: plant.moreInfo,
        tags: plant.tags.map(tag => tag.name),
      };
    });

    // Calculate total amount from plants
    let totalAmount = cartItems.reduce((total, item) => total + item.discountedPrice * item.qty, 0);

    // Apply coupon if provided
    let totalDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isValid: true });
      if (coupon) {
        totalDiscount = (totalAmount * coupon.discount) / 100;
      } else {
        return res.status(400).json({ message: 'Invalid coupon code' });
      }
    }

    // Check if an offer is being added
    if (offerId) {
      const offer = await Offer.findById(offerId);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }

      const offerItems = offer.plants.map(plant => {
        return {
          plantId: plant._id,
          name: plant.names.en.name || plant.names.ka.name,
          price: offer.upto, // Offer price
          discountedPrice: offer.percentageOff,
          qty: 1, // Default quantity for offer items
          tips: null,
          moreInfo: null,
          tags: [],
        };
      });

      cartItems.push(...offerItems);
      totalAmount += offerItems.reduce((total, item) => total + item.discountedPrice * item.qty, 0);
    }

    // Check if UUID exists: update the existing cart, otherwise create a new one
    let cartData;
    if (!uuid) {
      // Create a new cart if UUID is not provided
      cartData = new Cart({
        items: cartItems,
        totalAmount: totalAmount - totalDiscount,
        totalDiscount,
        couponCode,
        uuid: crypto.randomUUID(), // Generate UUID if not provided
      });
    } else {
      // If UUID exists, update the cart
      cartData = await Cart.findOneAndUpdate(
        { uuid },
        { items: cartItems, totalAmount: totalAmount - totalDiscount, totalDiscount, couponCode },
        { new: true }
      );

      if (!cartData) {
        return res.status(404).json({ message: 'Cart not found' });
      }
    }

    // Save the cart
    const savedCart = await cartData.save();
    return res.status(200).json({ message: 'Cart updated successfully', cart: savedCart });
  } catch (error) {
    console.error('Error in addToCart:', error.message);
    return res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
};
