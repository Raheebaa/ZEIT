const mongoose = require("mongoose");

const productOffers =new mongoose.Schema({

Productname:{
    type:String
},
startDate:{
    type:Date
},
endDate:{
    type:Date
},
offerPercentage:{
    type:Number
},
Status:{
    type:Boolean,
    default:true,
}

});
const productOfferModel = mongoose.model("ProductOffer", productOffers);

module.exports = productOfferModel;
