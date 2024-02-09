const mongoose = require("mongoose"); 

const adminSchema = new mongoose.Schema({
    Username:  { type: String},
    Password: { type: String},
    Email: { type: String},
    Joineddate:{type:Date},
    status:{type:Boolean}
})
const admins=mongoose.model("admins",adminSchema)

module.exports=admins