
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
    useCoupon: async (req, res) => {
        try {
            // console.log("coupon added"); 


            console.log(req.session, "consoleing the session from the use coupons")
            const { couponCode } = req.body;
            console.log(couponCode);
            const userData = await Users.findOne({ email: req.session.email })

            const cartData = await Cart.findOne({ userId: userData._id })
            const purchaseAmount = req.session.totalPrice
            const coupons = await coupon.findOne({ Coupon_code: couponCode });

            if (!coupons) {
                return res.json({ success: false, message: 'Coupon not found' });
            }

            if (!coupons.IsActive) {
                return res.json({ success: false, message: "Coupon is not active" });

            }

            const isCouponUsed = userData.usedCoupons.some(usedCoupon => usedCoupon.couponCode === couponCode);
            console.log(isCouponUsed);
            if (isCouponUsed) {

                console.log('going to if condition of is coupon used')
                return res.json({ success: false, message: 'Coupon already used' });
            }

            if (purchaseAmount < coupons.Min_amount) {
                console.log('going to if case of purchase is lesser than the coupon min amount')
                return res.json({ success: false, message: 'Purchase amount does not meet the minimum requirement for the coupon' });
            }
            console.log("--------", purchaseAmount, coupons.Min_amount);
            if (purchaseAmount < coupons.DiscountAmount) {


                return res.json({ success: false, message: 'Purchase Amount must Greater Than Discount amount' });
            }

            const currentDate = new Date();
            const endDate = new Date(coupons.Expirey_date);
            if (currentDate > endDate) {
                console.log('going to if condition of coupon expired')
                return res.json({ success: false, message: 'Coupon has expired' });
            }
            console.log(currentDate, endDate, "current date and end date");

            const discountedAmount = Math.min(purchaseAmount, coupons.DiscountAmount);
            const totalAfterDiscount = Math.floor(purchaseAmount - discountedAmount);
            req.session.TotalPrice = totalAfterDiscount

            cartData.coupon = discountedAmount;

            await cartData.save();

            console.log(totalAfterDiscount, "***********", "totall after the discount");
            userData.usedCoupons.push({
                Coupon_code: couponCode,
                discountedAmount: discountedAmount,
                usedDate: new Date(),
            });
            await userData.save();
            console.log(userData, "//////////////////////////////////////////////////////");



            // const updateOrder = await order.findOne({})


            console.log(discountedAmount, totalAfterDiscount, "conseled data xomng")

            return res.json({
                success: true,
                message: 'Coupon applied successfully',
                coupon: discountedAmount,
                discountedAmount: discountedAmount,
                TotalPrice: totalAfterDiscount,
                coupon: discountedAmount
            });
        } catch (error) {
            console.error(error, "error happpened in coupon management")
        }
    },

    cancelcoupon: async (req, res) => {
        try {

            console.log("function for cancel coupon started working")
            const userData = await Users.findOne({ email: req.session.email });
            const cartData = await Cart.findOne({ userId: userData._id });
            const purchaseAmount = req.session.totalPrice


            console.log(userData, "data of user from cancel coupon")
            // Check if there's a coupon applied
            if (!cartData.coupon || cartData.coupon === 0) {

                console.log("no coupon found")
                return res.json({ success: false, message: 'No coupon applied to cancel.' });

            }

            console.log(cartData, "before saving to 0 for canceling the coupon")

            cartData.coupon = 0;
            await cartData.save();

            console.log(cartData, "after changing to 0 for canlling the coupon")

            // Remove the used coupon from the user's data
            const { couponCode } = req.body;
            userData.usedCoupons = userData.usedCoupons.filter(usedCoupon => usedCoupon.couponCode !== couponCode);
            await userData.save();




            return res.json({
                success: true, message: 'Coupon canceled successfully.', coupon: 0,
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
                console.log('Cart not found.');
                return res.status(400).json({ success: false, message: 'Cart not found.' });
            }
            
            const coupons = await coupon.findOne({ Coupon_code: couponCode, IsActive: true });
            
            if (!coupons) {
                return res.status(400).json({ success: false, message: 'Invalid coupon code or coupon is not active.' });
            }
            
            const currentDate = new Date();
            if (currentDate < coupon.Start_date || currentDate > coupon.Expirey_date) {
                return res.status(400).json({ success: false, message: 'Coupon is expired or not yet valid.' });
            }
            
            const cartTotal = carts.reduce((total, cart) => total + cart.TotalAmount, 0);
        
            const discountAmount = coupons.DiscountAmount || 0;
            const updatedTotalAmount = cartTotal - discountAmount;
            
            console.log('Coupon applied successfully:', couponCode);
            
            // Return discount amount and updated total amount in the response
            res.status(200).json({
                success: true,
                message: 'Coupon applied successfully.',
                discountAmount: discountAmount,
                updatedTotalAmount: updatedTotalAmount
                    
            });
        } catch (error) {
            console.error('Error applying coupon:', error);
            return res.status(500).json({ success: false, message: 'Internal server error.' });
        }
    },
    
    
    
}