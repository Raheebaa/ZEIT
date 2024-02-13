const express = require('express');
const router = express.Router();
const product = require('../models/productSchema');
const Cart = require("../models/cartModel");
const Users = require("../models/usermodel");
const productUpload = require('../models/productSchema');
const Brands = require('../models/brandmodel');
const categoryoffer=require('../models/categoryOffer')

module.exports = {

    

    toCart: async (req, res) => {
        try {
            const brands = await Brands.find({});
            const email = req.session.email;
            const user = await Users.findOne({ email: email });
            const couponCode = req.body.couponCode;
            const catoffers = await categoryoffer.find({ });
            
            if (!user) {
                return res.send('not user is there');
            }

            const userId = user._id;
            const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

            if (!cart) {
                return res.render('user/cart', { cart: null, brands: [], totalCartPrice: 0, totalQuantity: 0, TAX: 0, totalPriceWithTAX: 0, showCheckoutButton: false });
            }

            const totalCartPrice = await cart.calculateTotalPrice().then(() => cart.TotalAmount);
            const totalQuantity = cart.calculateTotalQuantity();
            const TAX = await cart.calculateTAX(); // Now it returns a promise, so await it
            const totalPriceWithTAX = parseFloat(totalCartPrice) + parseFloat(TAX);

            // Check if the cart is empty and set the showCheckoutButton variable accordingly
            const showCheckoutButton = cart.items.length > 0;

            res.render('./user/cart', { cart, brands, totalCartPrice, totalQuantity, TAX, totalPriceWithTAX, showCheckoutButton, catoffers });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    },


    addToCart: async (req, res) => {
        try {
            const email = req.session.email;
            const user = await Users.findOne({ email: email });
    
            if (!user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
    
            const userId = user._id;
            const { itemId, quantity } = req.body;
            const productId = itemId;
    
            let userCart = await Cart.findOne({ userId });
    
            if (!userCart) {
                userCart = new Cart({ userId, items: [{ productId, quantity: quantity }] });
            } else {
                const existingItem = userCart.items.find(item =>
                    item.productId && productId && item.productId.toString() === productId.toString()
                );
    
                if (existingItem) {
                    const newQuantity = quantity;
                    existingItem.quantity = newQuantity;
                    // Keep the original price in the cart
                    if (newQuantity > existingItem.productId.stock) {
                        return res.status(400).json({ error: 'Not enough stock available' });
                    }
    
                    existingItem.quantity = newQuantity; // Update the quantity
                } else {
                    // Populate the productId field to retrieve product details including discountAmount
                    const product = await productUpload.findById(productId); // Remove .populate('productId')
                    const Price = product ? product.price : 0;
                    const discountAmount = product ? product.discountAmount : 0;
                    userCart.items.push({ productId, quantity: quantity, Price: Price, discountAmount: discountAmount });
                }
            }
    
            // Calculate total quantity and total price after making updates
            const totalQuantity = userCart.calculateTotalQuantity();
    
            // Call calculateTotalPrice to ensure TotalAmount is accurate
            await userCart.calculateTotalPrice();
            const totalPrice = userCart.TotalAmount;
    
            // Save the cart after making updates
            await userCart.save();
    
            res.status(200).json({ message: 'Product added to cart successfully.', totalQuantity, totalPrice });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },
    
    
    
    removeCart: async (req, res) => {
        try {
            const email = req.session.email;
            const user = await Users.findOne({ email: email });

            if (!user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const userId = user._id;
            const productId = req.params.id;

            // Use findOneAndUpdate to update the document in the database
            const updatedCart = await Cart.findOneAndUpdate(
                { userId: userId },
                { $pull: { items: { productId: productId } } },
                { new: true }
            );

            if (!updatedCart) {
                return res.status(404).json({ error: 'Cart not found' });
            }

            // Recalculate total price (modify updatedCart in place)
            updatedCart.calculateTotalPrice();

            // Respond with success
            res.json({ success: true, message: "item removed from cart" });
        } catch (error) {
            console.log("error removing item", error);
            res.status(500).json({ success: false, message: "error removing item from cart" });
        }
    },
    getCartInfo: async (req, res) => {
        try {
            const email = req.session.email;
            const user = await Users.findOne({ email: email });

            if (!user) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const userId = user._id;
            const cart = await Cart.findOne({ userId }).populate('items.productId');

            res.json(cart);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    },
    updateCartQuantity: async (req, res) => {
        try {
            const itemId = req.body.itemId;
            const newQuantity = req.body.newQuantity;
    
            const updatedCart = await Cart.updateQuantity(itemId, newQuantity);
            return res.json({
                success: true,
                message: 'Cart quantity updated successfully',
                updatedCart: updatedCart,
            });
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            
            // Check if the error is due to a stock limit
            if (error.name === 'StockLimitError') {
                return res.status(400).json({
                    success: false,
                    stockLimitReached: true,
                    message: 'Stock limit reached. Cannot update cart quantity.',
                });
            }
    
            // For other errors, return a generic message
            return res.status(500).json({
                success: false,
                message: 'Internal server error. Failed to update cart quantity.',
            });
        }
    },

};
