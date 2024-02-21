
const express = require('express')
const router = express.Router();
const fs = require('fs');
const Users = require("../models/usermodel")
const coupon = require('../models/coupen')
const Cart = require('../models/cartModel');
const order= require('../models/orderModel')
const { log } = require('console');



module.exports = {

    getcoupon: async (req, res) => {
        const coupons = await coupon.find({})

        res.render('admin/coupon', { coupons, err: '' })
    },
    addcoupon: (req, res) => {


        res.render('admin/addcoupon', { err: '' })
    },


    postaddcoupon: async (req, res) => {
        try {


            const newcode = req.body.Coupon_code



            const existingCoupons = await coupon.find({ Coupon_code: newcode })


            if (existingCoupons.length > 0) {
                console.log('coupon is existing ')
                res.render('admin/addcoupon', { err: 'Coupon already exists' })
            } else {



                const coupons = new coupon({
                    CouponName: req.body.CouponName,
                    Coupon_code: req.body.Coupon_code,
                    Min_amount: req.body.Min_amount,
                    Max_amount: req.body.Max_amount,
                    Start_date: req.body.Start_date,
                    Expirey_date: req.body.Expirey_date,
                    Max_count: new Date(),
                    IsActive: true,
                    DiscountAmount: req.body.DiscountAmount,

                });
                await coupons.save();

                res.redirect('/admin/coupon')
            }

        } catch (error) {
            // res.render('admin/addcoupon', { err: error.message })
            console.log(error)
            // res.status(500).json({ success: false, message: 'Internal server error' });
            // res.render('admin/404')

        }
    },
    deletecoupon: async (req, res) => {
        console.log('delete api calling');
        const couponId = req.params.id
        // console.log(couponId, "couponnnnn iddddddddddd")
        let coupons = await coupon.findByIdAndDelete(couponId)
        res.redirect('/admin/coupon')
    },

    geteditcoupon: async (req, res) => {

        let id = req.params.id;
        console.log(id, "getting the idd")
        let coupons = await coupon.findOne({ _id: id });
        console.log(coupons, "coupons after finding")

        if (coupons == null) {
            res.redirect('/admin/coupon');
        } else {
            res.render('admin/editcoupon', { coupons: coupons, err: "" });
        }
    },



    posteditcoupon: async (req, res) => {
        try {
            const couponId = req.params.id;

            const newCode = req.body.Coupon_code;


            const existingCoupon = await coupon.findOne({ Coupon_code: newCode });

            if (existingCoupon && existingCoupon._id.toString() !== couponId) {
                // If the coupon code exists for a different coupon, show an error
                console.log('already existing');
                return res.render('admin/editcoupon', { coupons: existingCoupon, err: 'Coupon code already exists' });
            } else {
                // Continue with updating the coupon
                const updatedCouponData = req.body;
                console.log(updatedCouponData, "data of the edited coupon");

                const updatedCoupon = await coupon.findByIdAndUpdate(
                    couponId,
                    { $set: { ...updatedCouponData } },
                    { new: true }
                );
                res.redirect('/admin/coupon');
                console.log(updatedCoupon, "----------")
            }
        } catch (error) {
            console.error('Error updating coupon', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    },
   
    cancelcoupon: async (req, res) => {
        try {
            const userData = await Users.findOne({ email: req.session.email });
            const cartData = await Cart.findOne({ userId: userData._id });
            const purchaseAmount = req.session.totalPrice;
    
            if (!cartData.coupon || cartData.coupon === 0) {
                return res.json({ success: false, message: 'No coupon applied to cancel.' });
            }
    
            cartData.coupon = null; // Corrected typo here
            await cartData.save();
    
            userData.usedCoupons = userData.usedCoupons.filter(usedCoupon => usedCoupon.couponCode !== couponCode);
            await userData.save();
    
            return res.json({
                success: true,
                message: 'Coupon canceled successfully.',
                coupon: null, // Changed to null to remove the coupon
                TotalPrice: purchaseAmount,
                coupon: 0
            });
        } catch (error) {
            console.error(error);
            return res.json({ success: false, message: 'Error canceling the coupon.' });
        }
    },

    couponuserside: async (req, res) => {
        try {
            const coupons = await coupon.find({});

            if (!coupons) {
                return res.status(404).send('Coupon not found');
            }

            res.render('./user/coupon', { coupons });
        } catch (error) {
            console.error('Error fetching coupon:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    applaycoupon: async (req, res) => {
        try {
            const email = req.session.email;
            const user = await Users.findOne({ email: email });
            const couponCode = req.body.couponCode;
            const carts = await Cart.find({});
    
            if (!carts || carts.length === 0) {
                return res.status(400).json({ success: false, message: 'Cart not found.' });
            }
    
            const coupons = await coupon.findOne({ Coupon_code: couponCode, IsActive: true });
    
            if (!coupons) {
                return res.status(400).json({ success: false, message: 'Invalid coupon code or coupon is not active.' });
            }
    
            const currentDate = new Date();
            if (currentDate < coupons.Start_date || currentDate > coupons.Expirey_date) {
                return res.status(400).json({ success: false, message: 'Coupon is expired or not yet valid.' });
            }
    
            // Check if the user has already used this coupon
            if (user.usedCoupons.some(usedCoupon => usedCoupon.couponCode === couponCode)) {
                return res.status(400).json({ success: false, message: 'You have already used this coupon.' });
            }
    
            // Add the coupon to the user's used coupons list
            user.usedCoupons.push({ couponCode });
            await user.save();
    
            const cartTotal = carts.reduce((total, cart) => cart.TotalAmount, 0);
    
            const discountAmount = coupons.DiscountAmount || 0;
            const updatedTotalAmount = cartTotal - discountAmount;
    
            console.log('Coupon applied successfully:', couponCode);
    
            res.status(200).json({
                success: true,
                message: 'Coupon applied successfully.',
                discountAmount: discountAmount,
                updatedTotalAmount: updatedTotalAmount
            });
        } catch (error) {
            console.error('Error applying coupon:', error);
            res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    },
       
    
}