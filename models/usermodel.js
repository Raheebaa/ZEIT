const mongoose = require('mongoose');
require('dotenv').config();
const TransactionSchema = new  mongoose.Schema({
  amount: { type: Number },
  transactionType: { type: String, enum: ['debit', 'credit'] },
  timestamp: { type: Date, default: Date.now },
  description: { type: String },
});
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
   
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isBlocked:{
    type:Boolean,
    default:false
  },
  Address: [
    {
      name:{type:String},
      addressLine: { type: String },
      city: { type: String },
      pinCode: { type: String },
      state: { type: String },
      MobileNumber: { type: Number },
    },
  ],
  profilePhoto:{type:String},
  usedCoupons:[
    { couponCode: { type: String },
     discountedAmount: { type: Number },
      usedDate: { type: Date } }
    ],
  
  referralId:{
    type:String
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
  },

});

const User = mongoose.model("Users", userSchema);

module.exports = User;
