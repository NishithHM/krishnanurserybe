
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Coupon = require('../models/coupon');
const PlantInfo = require('../models/plant_info.model');

// Add or update the cart
exports.addToCart = async (req, res) => {
  try {
    const { cart, couponCode, uuid } = req.body;

    // Validate the request body
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ message: 'Cart cannot be empty' });
    }

    //  the plants exist in the database plat_info
    const plantIds = cart.map(item => item.plantId);
    const plants = await PlantInfo.find({
      _id: { $in: plantIds },
      status: 'PUBLISH',
      isActive: true
    });

    if (plants.length !== cart.length) {
      return res.status(400).json({ message: 'Some plants are invalid or inactive' });
    }

    // Map cart items with proper plant data
    const cartItems = cart.map(item => {
      const plant = plants.find(p => p._id.toString() === item.plantId);
      return {
        plantId: plant._id,
        name: plant.names.en.name || plant.names.ka.name,
        price: plant.sellingPrice,
        discountedPrice: plant.discountedSellingPrice || plant.sellingPrice, // 
        qty: item.qty,
        tips: plant.tips.join(', '), // conversion purpose
        moreInfo: plant.moreInfo,
        tags: plant.tags.map(tag => tag.name)
      };
    });

    // calci 
    let totalAmount = cartItems.reduce((total, item) => total + item.discountedPrice * item.qty, 0);

    // Apply coupon if given
    let totalDiscount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode, isValid: true });
      if (coupon) {
        totalDiscount = (totalAmount * coupon.discount) / 100; 
      } else {
        return res.status(400).json({ message: 'Invalid coupon code' });
      }
    }

    // Check if UUID exists, update the existing cart, otherwise create a new one
    let cartData;
    if (!uuid) {
      const userId = req.user ? req.user.id : mongoose.Types.ObjectId(); // 

      cartData = new Cart({
        userId,
        items: cartItems,
        totalAmount: totalAmount - totalDiscount,
        totalDiscount,
        couponCode,
        uuid: mongoose.Types.ObjectId().toString() // Generate UUID if not 
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
