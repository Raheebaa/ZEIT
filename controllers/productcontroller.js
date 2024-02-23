const express = require('express')
const fs = require('fs');
const mongoose = require('mongoose');
const user = require('../models/users')
const router = express.Router();
const productModel = require('../models/productSchema')
const brand = require('../models/brandmodel')
const categories = require('../models/category')
const Review = require('../models/productreviewModel');
const { uploadMultiple } = require('../middleware/multer')
const { upload } = require('../middleware/multer')
module.exports = {

  showProduct: async (req, res) => {
    try {
      const products = await productModel.find({}).populate('category').populate('brand');
  
      const page = parseInt(req.query.page) || 1;
      const transactionsPerPage = 10;
      const startIndex = (page - 1) * transactionsPerPage;
      const endIndex = startIndex + transactionsPerPage;
  
      // Use slice to get the paginated products
      const paginatedProducts = products.slice(startIndex, endIndex);
  
      // Define currentPage based on the page query parameter
      const currentPage = page;
  
      // Render the product page with paginated products
      res.render('./admin/product', { products: paginatedProducts, currentPage });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
  },
  
  getAddproduct: async (req, res) => {
    try {
      const category = await categories.find()
      const brands = await brand.find()

      res.render('./admin/addproduct', { category, brands })
    } catch (error) {
      console.log(error);
    }
  },

  postAddproduct: async (req, res) => {
    try {
        const ProductImage = [];
        const { ProductName, category, Description, stock, brands, price } = req.body;
        const isnewarrival = req.body.isNewArrival === 'on';

        // Process each image
        for (let i = 1; i <= 3; i++) {
            const fieldName = `image${i}`;
            if (req.files[fieldName] && req.files[fieldName][0]) {
                ProductImage.push(req.files[fieldName][0].filename);
            }
        }

        const brandObject = await brand.findOne({ BrandName: brands });
        const categoryObject = await categories.findOne({ CategoryName: category });
        console.log('brandObject:', brandObject);
        console.log('categoryObject:', categoryObject);

        // No need for validation checks

        const savedProduct = await productModel.create({
          ProductName,
          ProductImage,
          Description,
          category: categoryObject?._id, 
          stock,
          quantity: 1, // or any default value
          brand: brandObject?._id,
          price,
          isNewArrival: isnewarrival
      });
      

        res.redirect('/admin/product');
    } catch (error) {
        // Handle any errors that occur during the process
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
},

  
  showeditproduct: async (req, res) => {
    try {
      const { productId } = req.params;
      // console.log(productId,'idddddddddddd');
      const product = await productModel.findById(productId).populate('ProductName').populate('category');
      // console.log('product is', product)
      const category = await categories.find();
      const brands = await brand.find();
      res.render('./admin/editproduct', { product, category, brands });
    } catch (error) {
      console.error(`Error fetching product details: ${error.message}`);
      res.status(500).send('Internal Server Error');
    }
  },

  updateProduct: async (req, res) => {
    try {
      const id = req.params.productId;
      const { ProductName, category, BrandName, price, stock } = req.body;
  
      // Find the product by ID
      const product = await productModel.findById(id);
  
      // Check if the product exists
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
  
      // Update the product fields
      product.ProductName = ProductName;
      product.category = category;

      product.brand = BrandName; // Update the brand ID
  
      product.price = price;
      product.stock = stock;
  
      // Save the updated product
      await product.save();
  
      // Check if there are any images to update
      if (req.files) {
        for (let i = 0; i < 3; i++) {
          const fieldName = `image${i}`;
          if (req.files[fieldName] && req.files[fieldName][0]) {
            product.ProductImage[i] = req.files[fieldName][0].filename;
          }
        }
        // Save the updated images
        await product.save();
      }
  
      // Redirect to the product page
      res.redirect('/admin/product');
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },   
  blockProduct: async (req, res) => {
    try {
      const productId = req.params.productId;
      await productModel.findByIdAndUpdate(productId, { isBlocked: true });
      const products = await productModel.find({}).populate('category').populate('brand');
      const currentPage = 1; // Define currentPage here
      res.render('./admin/product', { products, currentPage });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  unblockProduct: async (req, res) => {
    try {
      const productId = req.params.productId;
      await productModel.findByIdAndUpdate(productId, { isBlocked: false });
      const products = await productModel.find({}).populate('category').populate('brand');
      const currentPage = 1; // Define currentPage here
      res.render('./admin/product', { products, currentPage });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateQuantity: async (req, res) => {
    try {
      const { itemId, change, newQuantity } = req.body;

      // Fetch the product from the database
      const product = await productModel.findById(itemId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      // Assuming stock is an integer field representing available quantity
      const updatedStock = product.stock - change;

      if (updatedStock < 0) {
        return res.status(400).json({ success: false, message: "Insufficient stock" });
      }

      // Update the stock and save the product
      product.stock = updatedStock;
      await product.save();

      // Send a response back to the client with the updated total quantity
      res.json({
        success: true,
        totalQuantity: newQuantity
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  },
  saveReview: async (req, res) => {
    try {
      const { productId, comment } = req.body;
    // Assuming you have a userId associated with the review, you can access it from the req.user object if you're using authentication
    const userId = req.user._id; // Adjust this according to your authentication mechanism

    // Create a new Review object with the provided data
    const newReview = new Review({
      productId,
      userId,
      comment
    });
console.log(newReview);
    // Save the review to the database
    await newReview.save();

    // Send a success response
    res.status(201).json({ message: 'Review saved successfully' });
  } catch (error) {
    // If an error occurs, send an error response
    console.error('Error saving review:', error);
    res.status(500).json({ message: 'Failed to save review' });
  }
},
  
}