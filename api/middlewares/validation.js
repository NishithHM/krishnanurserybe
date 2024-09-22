const { body, validationResult } = require('express-validator');

const validateCartRequest = [
    body('cart').isArray({ min: 1 }).withMessage('Cart must contain at least 1 item'),
    body('cart.*.procurementId').isMongoId().withMessage('Invalid procurement ID format'),
    body('cart.*.qty').isInt({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    body('couponCode').optional().isString().withMessage('Coupon code must be a string'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = { validateCartRequest };
