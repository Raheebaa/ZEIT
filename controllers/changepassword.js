// const sendOTP = require("./otpController")
// const OTP = require("../model/otpModel")
// const productUpload= require("../model/productModel")
const Users= require("../models/usermodel")
// const Cart= require("../model/usermodel")
const bcrypt = require("bcrypt")



const changePass = async (req, res) => {
  try {
    const email = req.session.email;
    console.log(email, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');

    // Check if the user with the provided email exists
    const check = await Users.findOne({ email: req.session.email });
    console.log("User check:", check);

    if (check) {
      // Compare the provided old password with the stored hashed password
      const isMatch = await bcrypt.compare(req.body.oldPassword, check.password);
      console.log("Password Match:", isMatch);

      if (isMatch) {
        // Hash the new password
        const pass = await bcrypt.hash(req.body.newPassword, 10);
        console.log("New Password:", req.body.newPassword);
        console.log("Email:", email);

        // Update the user's password in the database
        const update = await Users.updateOne({ email: email }, { $set: { password: pass } });
        console.log("Update Result:", update);

        if (update.modifiedCount > 0) {
          return res.json({ success: true });
        } else {
          // No password was modified, possibly the same password
          return res.json({ success: false, error: "Password unchanged or update failed" });
        }
      } else {
        // Provided old password is incorrect
        return res.json({ success: false, error: "Wrong password............" });
      }
    } else {
      // User with the provided email does not exist
      return res.json({ success: false, error: "Invalid email" });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.json({ success: false, error: "Internal server error" });
  }
};

  
module.exports={
    changePass,

}