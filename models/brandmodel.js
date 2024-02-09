const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema({
  
    BrandName: {
    type: String,
    require:true,
    unique:true,
  },
  isBlocked:{
    type:Boolean,
    default:false
  },
   
});

const Brand = mongoose.model("brands", BrandSchema);

module.exports = Brand;