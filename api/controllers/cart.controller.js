
// const mongoose = require('mongoose');
const Cart = require('../models/cart.model');
const PlantInfo = require('../models/plant_info.model');
const Customer = require('../models/customer.model');
const Offer = require('../models/offers.models');
const crypto = require('crypto');

// Add or update the cart
exports.addToCart = async (req, res) => {
  try {
    const { cart,uuid ,} = req.body;

    
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: 'Cart must be a non-empty array' });
    }


    const plantIds = cart.map(item => item.plantId);
    const plants = await PlantInfo.find({
      _id: { $in: plantIds },
      status: 'PUBLISH',
      isActive: true,
    });

    if (plants.length !== cart.length) {
      return res.status(404).json({ message: 'Some plants are invalid or inactive' });
    }

    
    const cartItems = cart.map(item => {
      const plant = plants.find(p => p._id.toString() === item.plantId.toString());

      if (!plant) {
        throw new Error(`Plant with ID ${item.plantId} not found`);
      }

      return {
        plantId: plant._id,
        name: plant.names, //  plant name
        price: plant.sellingPrice,
        discountedPrice: plant.discountedSellingPrice || plant.sellingPrice,
        qty: item.qty,
        tips: plant.tips.join(', '),
        moreInfo: plant.moreInfo,
        tags: plant.tags.map(tag => tag.name),
      };
    });

    
 
  
    // Calc
    let totalAmount = cartItems.reduce((total, item) => total + item.sellingPrice * item.qty, 0);


    // Check if UUID 
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



    // Save the cart
    const savedCart = await cartData.save();
    return res.status(200).json({ message: 'Cart updated successfully', cart: savedCart });
  } catch (error) {
    console.error('Error in addToCart:', error.message);
    return res.status(500).json({ message: 'Error updating cart', error: error.message });
  }
}; 

