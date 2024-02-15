const mongoose = require('mongoose');

const { Schema } = mongoose;

const OrdersSchema = new Schema({
  Status: { type: String },
  Items: [{
    Price: { type: Number },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' }, // Correctly reference the Product model
    quantity: { type: Number },  
  }],
  UserID: { type: Schema.Types.ObjectId },
  Address: {
    name:{type:String},
    addressLine: { type: String },
    city: { type: String },
    pincode: { type: String },
    state: { type: String },
    mobileNumber:{type:Number}
  },
  paymentMethod:{type : String},
  paymentStatus:{type : String},
  TotalAmount: { type: Number },
  OrderDate: { type: Date },
  PaymentId: { type: Number },
});

const Orders = mongoose.model('Orders', OrdersSchema);

module.exports= Orders;
