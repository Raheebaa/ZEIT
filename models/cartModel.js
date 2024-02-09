const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
        },
        quantity: {
            type: Number,
            default: 1
        },
        Price: {
            type: Number,
            default:1
        },
        TAX: {
            type: Number,
            default: 0,
        },
    }],
    TotalAmount: { type: Number, default: 1 }
});

cartSchema.methods.calculateTotalQuantity = function () {
    return this.items.reduce((total, item) => total + item.quantity, 0);
};

cartSchema.methods.calculateTotalPrice = async function () {
    let totalPrice = 0;

    for (const item of this.items) {
        if (item.productId?.price !== undefined) {
            totalPrice += item.quantity * (item.productId?.price || item.Price || 1);

        } else {
            console.error('Product or product price not available:', item);
        }
    }

    const TAX = totalPrice * 0.01; // Assuming a 1% TAX
    this.TAX = TAX; // Store the tax in the document
    this.TotalAmount = totalPrice + TAX;

    // Save the cart after updating properties
    await this.save();

    return this.TotalAmount;
};

cartSchema.methods.calculateTAX = async function () {
    await this.calculateTotalPrice();

    return this.TAX;
};


cartSchema.statics.updateQuantity = async function (itemId, newQuantity) {
    try {
      const Cart = mongoose.model("Cart");
  
      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        throw new Error('Invalid ObjectId for itemId');
      }
  
      const cartItem = await Cart.findOne({ "items._id": itemId });
      console.log(cartItem, '............itememememememememememememmememe');
  
      if (!cartItem) {
        throw new Error('Cart item not found');
      }
  
      // Find the index of the item in the items array
      const itemIndex = cartItem.items.findIndex(item => item._id.toString() === itemId);
  
      if (itemIndex === -1) {
        throw new Error('Cart item not found');
      }
  
      // Update the quantity
      cartItem.items[itemIndex].quantity = newQuantity;
  
      // Save the updated cart item
      const updatedCartItem = await cartItem.save();
      return updatedCartItem;
    } catch (error) {
      throw error;
    }
  };
  
const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
