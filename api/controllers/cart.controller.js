const Cart = require('../models/cart.model');
const PlantInfo = require('../models/plant_info.model');
const Offer = require('../models/offers.models');
const crypto = require('crypto');

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

      // Calculate 
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

      // Apply offer if offerId 
      let errorMessage = ''; //storing

      if (offerId) {
          const offer = await Offer.findById(offerId);

          if (!offer) {
              errorMessage = 'Offer not found'; // message instead of returning 404
          } else if (!offer.isActive) {
              errorMessage = 'Offer is not active'; // 
          } else {
            
              const offerPlantIds = offer.plants.map(plant => plant._id.toString());

              const eligibleForOffer = cartItems.every(item => offerPlantIds.includes(item.plantId.toString()));

              if (!eligibleForOffer) {
                  errorMessage = 'Some cart items are not eligible for the applied offer'; // Store error message
              } else {
                  let applicable = false;

                      //  it is needed  or not:- totalItemsInCart < offer.minPurchaseQty 
                  if (offer.ordersAbove && totalAmount >= offer.ordersAbove && cartItems.length >= offer.minPurchaseQty) {
                      applicable = true;
                  }

                  if (!applicable) {
                      errorMessage = `Cart does not meet the minimum purchase amount for this offer. OrdersAbove: ${offer.ordersAbove}`;
                  }

                  //  calculate the discount
                  if (!errorMessage) {
                      const percentageDiscount = (totalAmount * offer.percentageOff) / 100;
                      // const offerDiscount = Math.min(percentageDiscount); 
                       //  discount does not exceed the  value
                      const offerDiscount = percentageDiscount > offer.upto ? offer.upto : percentageDiscount;

                      // Update the cart :- by  discount and totalAmount
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
          },
          errorMessage, // msg  will be send if validation goes wrong
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
