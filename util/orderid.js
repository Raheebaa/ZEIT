const  {v4 : uuidv4} = require("uuid")


const generateId=()=>{
    const orderId = "order_"+uuidv4().slice(16)
    // console.log(orderId);
    return orderId
}
module.exports={generateId}
