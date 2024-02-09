const mongoose=require('mongoose')
require('../config/dbconfig')
require('dotenv').config()

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
       },
       email:{
        type:String,
        required:true
       },
       password:{
        type:String,
        required:true
       },
    date:{
        type:Date,
    },
    isBlocked:{
        type:Boolean,
        default:false

    },
   

})
const user=mongoose.model(process.env.USER_COLLECTION,userSchema)
module.exports=user