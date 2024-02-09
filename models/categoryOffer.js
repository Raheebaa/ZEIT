const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const CategoryOfferSchema = new mongoose.Schema({
    categoryId: {
    type: ObjectId,  
  },
  categoryName:{
    type:String
  },
  percentage:{
    type:Number
  },
  startDate: {
    type: Date, 
  },
  endDate: {
    type: Date,  
  }, 
  Status: {
    type: Boolean,
    default: true,
  },
});
const CategoryOffer = mongoose.model('CategoryOffer', CategoryOfferSchema);
module.exports = CategoryOffer;