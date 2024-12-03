
const Joi = require('joi');

const approveCartValidator = Joi.object({

    uuid: Joi.string().required(),
  
});

module.exports = { approveCartValidator };
