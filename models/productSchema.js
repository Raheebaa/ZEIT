const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  ProductName: {
    type: String,
    uppercase: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categories',
  },
  Description: {
    type: String,
  },
  ProductImage: {
    type: Array,
  },
  stock: {
    type: Number,
  },
  quantity: {
    type: Number,
    default: 1
  },
  price: {
    type: Number,
    min: 0,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'brands'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isNewArrival: {
    default: false,
    type: Boolean
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online', 'wallet'],
    default: 'cod',
  },
  discountAmount: {  // Add the discountAmount field here
    type: Number,
    default: 0,  // Default to 0 if no discount is applied
    validate: {
      validator: function (value) {
        return value >= 0 && value <= this.price; // Ensuring discountAmount is positive and less than or equal to price
      },
      message: 'Discount amount must be a positive number and less than or equal to the price.'
    }
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
