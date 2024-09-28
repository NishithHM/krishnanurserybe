
const { body } = require('express-validator');

exports.cartValidator = [
  body('cart').isArray().withMessage('Cart must be an array of items'),
  body('cart.*.plantId').isMongoId().withMessage('Invalid Plant ID format').notEmpty().withMessage('Plant ID is required'),
  body('cart.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('couponCode').optional().isString().withMessage('Coupon code must be a string')
];
