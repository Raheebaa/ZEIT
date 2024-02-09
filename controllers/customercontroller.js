const express=require('express')
const fs = require('fs');

const Users = require("../models/usermodel")
const router=express.Router();


module.exports={

    showCustomer: async (req, res) => {
        try {
          const users = await Users.find();
          res.render('./admin/Customers', { users });
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      },

      blockUser : async (req, res) => {
        try {
          const userId = req.params.userId;
          await Users.findByIdAndUpdate(userId, { isBlocked: true });
          res.redirect('/admin/Customers'); // Redirect to the admin customers page
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      },
      
    unblockUser:async (req, res) => {
        try {
          const userId = req.params.userId;
          await Users.findByIdAndUpdate(userId, { isBlocked: false });
          res.redirect('/admin/Customers'); // Redirect to the admin customers page
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      },
}