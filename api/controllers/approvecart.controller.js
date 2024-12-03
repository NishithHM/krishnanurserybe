const Cart = require('../models/cart.model');
const Billing = require('../models/billings.model');

exports.approvecart = async (req, res) => {
  try {

    if (!req.user || !req.user.role) {
      return res.status(403).send({ message: 'User role is required ' });
    }

    
    if (req.user.role !== 'admin' && req.user.role !== 'sales') {
      return res.status(403).send({ message: 'Unauthorized access' });
    }

    const { uuid } = req.params;

    const cart = await Cart.findOne({ uuid, status: 'placed' });
    if (!cart) {
      return res.status(404).send({ message: 'Cart not found or already approved' });
    }

    for (let item of cart.items) {
      const inventory = await Inventory.findOne({ procurementId: item.procurementId });
      if (!inventory || item.quantity > inventory.quantity) {
        return res.status(400).send({
          message: `Insufficient quantity for procurement ID: ${item.procurementId}`,
        });
      }
    }


    cart.status = 'approved';
    await cart.save();

    const invoiceId = 'O_N_L_0'; 


    const billingData = {
      invoiceId,
      customerName: cart.customerName,
      customerNumber: cart.customerNumber,
      procurementItems: cart.items.map(item => ({
        procurementId: item.procurementId,
        procurementName: item.procurementName,
        quantity: item.quantity,
        price: item.rate,
        totalPrice: item.quantity * item.rate, 
      })),
      totalPrice: cart.totalAmount,
      discount: cart.totalDiscount,
      soldBy: req.user.name, 
      status: 'approved',
    };

    const billing = new Billing(billingData);
    await billing.save();

    res.status(200).send({ message: 'Cart approved and billing created', invoiceId });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: 'Internal server error',
      error: err.message,
    });
  }
};
