const PlantInfo = require('../models/plant_info'); // 

// Add to cart
router.post('/customer/add-cart', async (req, res, next) => {
    const { cart, couponCode, uuid } = req.body;

    try {
        //  plantInfo IDs instead of procurementId
        const plantInfoIds = cart.map(item => item._id);  // Expecting _id from plantInfo
        const plantInfos = await PlantInfo.find({ 
            _id: { $in: plantInfoIds },
            status: 'PUBLISH',  //
            isActive: true      // 
        });

        if (plantInfos.length !== cart.length) {
            return res.status(400).json({ message: 'Invalid or inactive plant in cart' });
        }

        // Construct the cart items with plant info
        const cartItems = cart.map(item => {
            const plantInfo = plantInfos.find(p => p._id.toString() === item._id);
            return {
                plantId: plantInfo._id, // Updated field from plant info
                name: plantInfo.names?.customerName || plantInfo.names?.defaultName, // Adjust based on the names object structure
                price: plantInfo.sellingPrice,
                discountedPrice: plantInfo.discountedSellingPrice,
                qty: item.qty,
                tips: plantInfo.tips,  // Include tips
                moreInfo: plantInfo.moreInfo,  // Include more info
                tags: plantInfo.tags.map(tag => tag.name),  //  tags 
            };
        });

        // Calculate the total amount based on the plant prices
        let totalAmount = 0;
        cartItems.forEach(item => {
            totalAmount += item.discountedPrice * item.qty;
        });

        // Apply coupon if provided
        let totalDiscount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode, isValid: true });
            if (coupon) {
                totalDiscount = coupon.discount;
            } else {
                return res.status(400).json({ message: 'Invalid coupon code' });
            }
        }

        let updatedCart;
        if (!uuid) {
            // If no cart UUID, create a new one
            const newCart = new Cart({
                items: cartItems,
                totalAmount: totalAmount - totalDiscount,
                totalDiscount,
                couponCode
            });
            updatedCart = await newCart.save();
        } else {
            // If UUID exists, update the existing cart
            updatedCart = await Cart.findOneAndUpdate(
                { uuid },
                { items: cartItems, totalAmount: totalAmount - totalDiscount, totalDiscount, couponCode },
               // { new: true }//  get the updated document
               { new: false } // return the original document as it was before the update.
            );
        }

        res.status(200).json(updatedCart);
    } catch (error) {
        // If any error occurs, return 500 status with an error message
        res.status(500).json({ message: 'An internal server error occurred', error: error.message });
    }
});
