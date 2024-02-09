const mongoose=require ('mongoose')
require('dotenv').config()


const ReferalOffers=new mongoose.Schema({
    BonusPrice:{
        type:Number
    },
    Joincount:{
        type:Number
    },
    Added:{
        type:Date
    },
    Status:{
         type:Boolean,
    }
   
})

const Referaloffermodel=mongoose.model("refferal",ReferalOffers)

module.exports=Referaloffermodel