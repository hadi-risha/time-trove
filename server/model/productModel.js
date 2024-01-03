const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  category: {
    type: String, // assuming categories are limited to 'men' and 'women'
    required: true,
  },
  productDescription: {
    type: String,
    required: true,
  },
  firstPrice: {
    type: Number,
    required: true,
  },
  lastPrice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  images: [{
    type: String
  }],
  unlisted: {
    type: Boolean,
    default: false,
 },
 addToBag: {
  type: Boolean,
  default: false,
}
});

const productDB = mongoose.model('Productdb', productSchema);

module.exports = productDB;
