const express = require('express');
const Cart = require('../models/Cart');
const Procurement = require('../models/Procurement');
const Coupon = require('../models/Coupon');
const { validateCartRequest } = require('../middleware/validation');
const errorHandler = require('../middleware/errorHandler');
const { authorize } = require('../middleware/security');  // Authorization middleware
const router = express.Router();

//addcart
router.post('/add-cart', authorize, validateCartRequest, async (req, res, next) => {
    const { cart, couponCode, uuid } = req.body;

    try {
        const procurementIds = cart.map(item => item.procurementId);
        const procurements = await Procurement.find({ _id: { $in: procurementIds } });

        if (procurements.length !== cart.length) {
            return res.status(400).json({ message: 'Invalid plant in cart' });
        }

        const cartItems = cart.map(item => {
            const procurement = procurements.find(p => p._id.toString() === item.procurementId);
            return {
                procurementId: procurement._id,
                name: procurement.nameForCustomer,
                price: procurement.sellingPrice,
                qty: item.qty
            };
        });

        let totalAmount = 0;
        cartItems.forEach(item => {
            totalAmount += item.price * item.qty;
        });

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
            const newCart = new Cart({
                items: cartItems,
                totalAmount: totalAmount - totalDiscount,
                totalDiscount,
                couponCode
            });
            updatedCart = await newCart.save();
        } else {
            updatedCart = await Cart.findOneAndUpdate(
                { uuid },
                { items: cartItems, totalAmount: totalAmount - totalDiscount, totalDiscount, couponCode },
                { new: true }
            );
        }

        res.status(200).json(updatedCart);
    } catch (error) {
        next(error);
    }
});

 //getcart
router.get('/get-cart/:uuid', authorize, async (req, res, next) => {
    const { uuid } = req.params;

    try {
        const cart = await Cart.findOne({ uuid });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        res.status(200).json(cart);
    } catch (error) {
        next(error);
    }
});

router.use(errorHandler);

module.exports = router;
