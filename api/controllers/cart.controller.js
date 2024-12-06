
const Cart = require('../models/cart.model');
const PlantInfo = require('../models/plant_info.model');
const Offer = require('../models/offers.models');
const crypto = require('crypto');
const Procurements = require('../models/procurment.model');
const { isEmpty } = require('lodash');
const Tracker = require('../models/tracker.model');
const { convertCoverImagesToPresignedUrls } = require('./plant_info.controller');

// Add or update cart function
exports.addToCart = async (req, res) => {
    try {
        const { cart, uuid, offerId } = req.body;

        // Validate cart input
        if (!Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ message: 'Cart must be a non-empty array' });
        }

        // Fetch plant details
        const plantIds = cart.map(item => item.plantId);
        console.log('Plant IDs:', plantIds);
        
        // checking correct filter for plants
        const plants = await PlantInfo.find({
            _id: { $in: plantIds },
            status: 'PUBLISH',
            isActive: true,
        });

        // Checking if all plants in cart are :-  valid and active
        if (plants.length !== cart.length) {
            return res.status(404).json({ message: 'Some plants are invalid or inactive' });
        }

        // 
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
                procurementId: plant.procurementId
            };
        });

        console.log('Plant IDs:', cartItems);

        // Calculate total amount
        let totalAmount = cartItems.reduce((total, item) => total + item.discountedPrice * item.qty, 0);
        let totalDiscount= cartItems.reduce((total, item) => total + (item.price - item.discountedPrice )* item.qty, 0);
        let totalQty= cartItems.reduce((total, item) => total + item.qty, 0);
        console.log('Plant IDs:', cartItems);

        let cartData;
        if (!uuid) {
            // Create a new cart
            cartData = new Cart({
                items: cartItems,
                totalAmount,
                totalDiscount,
                uuid: crypto.randomUUID(), // Generate UUID
                status: 'cart', // bydefault status to cart
            });
        } else {
            // If UUID exists, update the cart
              await Cart.findOneAndUpdate(
                { uuid },
                { items: cartItems, totalAmount, totalDiscount },
                { new: false, returnDocument:'after'} 
            );

             cartData = await Cart.findOne({uuid})

            if (!cartData) {
                return res.status(404).json({ message: 'Cart not found' });
            }
        }

        // Offer logic
        let errorMessage = '';

        if (offerId) {
            const offer = await Offer.findById(offerId);

            if (!offer) {
                errorMessage = 'Offer not found';
            } else if (!offer.isActive) {
                errorMessage = 'Offer is not active';
            } else {
                const offerPlantIds = offer.plants.map(plant => plant._id.toString());
                const eligibleForOffer = cartItems.every(item => offerPlantIds.includes(item.procurementId.toString()));

                console.log(offerPlantIds, cartItems)

                if (!eligibleForOffer) {
                    errorMessage = 'Some cart items are not eligible for the applied offer';
                } else {
                    // Checking if cart meets offer requirements or not
                    const meetsOfferRequirements = offer.ordersAbove && totalAmount >= offer.ordersAbove && totalQty >= (offer.minPurchaseQty || 0);

                    if (!meetsOfferRequirements) {
                        errorMessage = `Cart does not meet the minimum purchase amount for this offer. Orders Above: ${offer.ordersAbove}`;
                    }

                    // Calculate the discount
                    if (!errorMessage) {
                        const percentageDiscount = (totalAmount * offer.percentageOff) / 100;
                        const offerDiscount = Math.min(percentageDiscount, offer.upto);
                        cartData.offerDiscount = offerDiscount;
                        cartData.totalAmount = totalAmount - offerDiscount;
                    }
                }
            }
        }else{
            cartData.offerDiscount = 0;
        }

        const savedCart = await cartData.save();

         res.status(200).json({
            message: 'Cart updated successfully',
            cart: {
                totalAmount: savedCart.totalAmount,
                totalDiscount: savedCart.totalDiscount,
                offerDiscount: savedCart.offerDiscount,
                items: savedCart.items,
                uuid: savedCart.uuid,
                status: savedCart.status,
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
        const { uuid, customer } = req.body; // Retrieve UUID and customer details

        // for validation of UUID and customer
        if (!uuid) {
            return res.status(400).json({ message: 'We need a UUID to process your checkout.' });
        }
        if (!customer || typeof customer !== 'object') {
            return res.status(400).json({ message: 'Please provide your customer details for checkout.' });
        }

        const { name, phone, pinCode, address, locality, state, city, landmark, alternateMobileNumber } = customer;
        if (!name || !phone || !pinCode || !address || !locality || !state || !city) {
            return res.status(400).json({ message: 'Customer details are missing. Please provide all required fields.' });
        }

        const pinCodeAsNumber = Number(pinCode); // Convert pin code to number

        const cart = await Cart.findOne({ uuid });

        //  cart exists
        if (!cart) {
            return res.status(404).json({ message: "We couldn't find your cart. Please check the UUID." });
        }

        // Update cart with customer details and status
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
        cart.status = 'placed'; //  status to placed


        // Save the updated cart
        const updatedCart = await cart.save();

        return res.status(200).json({
            message: "Thank you for your order! Your checkout was successful.",
            cart: updatedCart.toJSON() 
        });
    } catch (error) {
        console.error("Error in checkoutCart:", error);
        return res.status(500).json({ message: "Something went wrong. Please try again later." });
    }
};

exports.getplacedCart = async (req, res) => {
    try {
        const { startDate, endDate, sortBy, sortType } = req.body;

        
        const fromDate = new Date(startDate);
        const toDate = new Date(endDate);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format. Expected YYYY-MM-DD.' });
        }

        // query :- finding orders with status pllaced within the date range
        const query = {
            status: 'placed',
            createdAt: { $gte: fromDate, $lte: toDate },
        };

        // sort type 1 - ascending and -1 for descending
        const sortOptions = {};
        if (sortBy === 'createdOn') {
            sortOptions.createdAt = sortType; // 
        } else if (sortBy === 'totalPrice') {
            sortOptions.totalAmount = sortType; //
        }

        // Fetch the placed carts
        const carts = await Cart.find(query).sort(sortOptions);

        // Return the response with the fetched carts
        return res.status(200).json({
            message: 'Placed carts fetched successfully',
            data: carts,
        });
    } catch (error) {
        console.error('Error in getPlacedCarts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// Get Cart by UUID Function
exports.getCartByUuid = async (req, res) => {
    try {
        const { uuid } = req.params; // Take UUID 

        // Fetch the cart by UUID
        const cart = await Cart.findOne({ uuid }).lean();

        // Check if cart exists
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        const plantIds = cart.items.map(ele=> ele.plantId)

        const plants = await PlantInfo.find({
            _id: { $in: plantIds },
            status: 'PUBLISH',
            isActive: true,
        }).lean();
         cart.plants =  await Promise.all(plants.map(async ele=> {
            const s3Urls = await convertCoverImagesToPresignedUrls(ele.coverImages);
            return {...ele, coverImages: s3Urls, qty:cart.items.find(p=> p.plantId.toString() === ele._id.toString()).qty}
            }));

        // Return the cart details
        return res.status(200).json({
            message: "Cart retrieved successfully",
            cart
        });
    } catch (error) {
        console.error("Error retrieving cart:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


exports.approveCart = async (req,res)=>{
    const {uuid, extraFee} = req.body
    const cart = await Cart.findOne({uuid, status:'placed'})
    cart.totalAmount = cart.totalAmount + extraFee;
    cart.extraFee = extraFee;
    cart.status = 'approved'
    const plantIds = cart.map(item => item.plantId);
    console.log('Plant IDs:', plantIds);
    
    // checking correct filter for plants
    const plants = await PlantInfo.find({
        _id: { $in: plantIds },
        status: 'PUBLISH',
        isActive: true,
    });
    const items = cart.items.map(ele=> ({...ele, procurementId: plants.find(p=> p._id === ele.plantId)?.procurementId}))
    const {errors} = validatePricesAndQuantityAndFormatItems(items)
    if(isEmpty(errors)){
        const procurementQuantityMapping = {}
        items?.forEach(ele => {
            if (procurementQuantityMapping[ele.procurementId.toString()]) {
                procurementQuantityMapping[ele.procurementId.toString()] = procurementQuantityMapping[ele.procurementId.toString()] + ele.quantity
            } else {
                procurementQuantityMapping[ele.procurementId.toString()] = ele.quantity
            }
        })
        await updateRemainingQuantity(procurementQuantityMapping)

        const trackerVal = await Tracker.findOne({name:"customerInvoiceId"})
        cart.invoiceId = `NUR_${trackerVal.number}`
        trackerVal.number = trackerVal.number + 1
        await cart.save()
        await trackerVal.save()
        res.send({
            cart: cart.toJSON()
        })

    }else{
        res.status(400).send({ error: errors.join(' ') })
    }
}

const validatePricesAndQuantityAndFormatItems = async (items) => {
    const procurements = uniq(items.map(ele => new mongoose.mongo.ObjectId(ele.procurementId)))
    const errors = []
    const pipeline = [
        {
            '$match': {
                '_id': {
                    '$in': procurements
                }
            }
        }, {
            '$unwind': {
                'path': '$variants',
                'preserveNullAndEmptyArrays': true
            }
        }, {
            '$group': {
                '_id': {
                    'procurementId': '$_id',
                    'variantId': '$variants._id'
                },
                'val': {
                    $first: { $mergeObjects: ["$$ROOT.variants", { remainingQuantity: {$subtract:[ "$$ROOT.remainingQuantity", "$$ROOT.underMaintenanceQuantity" ]}, }, { pNames: "$$ROOT.names" }] }
                }
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': [
                        '$_id', '$val'
                    ]
                }
            }
        }
    ]
    console.log("validatePricesAndQuantity", JSON.stringify(pipeline))
    loggers.info(`validatePricesAndQuantity, ${pipeline}`)
    const results = await Procurements.aggregate(pipeline)
    for (const element of results) {
        const {
            procurementId: resultProcurementId,
            variantId: resultVariantId,
            pNames: procurementNames,
            remainingQuantity,
        } = element

        const { quantity } = items.find((ele) => ele.procurementId === resultProcurementId.toString()) || {}
        
        if (quantity > remainingQuantity) {
            errors.push(`Ooops!! stock of "${procurementNames?.en?.name}" is low, maximum order can be "${remainingQuantity}"`)
        }
    }

    return { errors }
}

const updateRemainingQuantity = async (object) => {
    const listValues = Object.entries(object);
    for (const [key, value] of listValues) {
        const procurment = await Procurements.findById(key)
        procurment.remainingQuantity = procurment.remainingQuantity - value
        procurment.soldQuantity = value
        await procurment.save()
    }
}