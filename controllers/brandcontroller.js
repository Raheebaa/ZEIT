const User = require("../models/usermodel");
const OTP = require("../models/otpModel");
const Admin = require("../models/adminModel");
const sendOTP = require("../controllers/otpcontroller");
const brandmodel = require('../models/brandmodel')
const { model } = require("mongoose")



module.exports = {
    showBrand: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const transactionsPerPage = 10;
            const startIndex = (page - 1) * transactionsPerPage;
            const endIndex = startIndex + transactionsPerPage;
    
            // Fetch all brands from the database
            const brands = await brandmodel.find({});
    
            // Use slice to get the paginated brands
            const paginatedBrands = brands.slice(startIndex, endIndex);
    
            // Define currentPage based on the page query parameter
            const currentPage = page;
    
            res.render('./admin/brand', { brands: paginatedBrands, currentPage });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    },
    
    getAddbrand: async (req, res) => {
        try {
            res.render('./admin/addbrand', { error: '' });
        } catch (error) {
            console.log("error");
        }
    },
    postAddbrand: async (req, res) => {
        try {
            const BrandName = req.body.BrandName;
            const existingBrand = await brandmodel.findOne({ BrandName: BrandName });
            if (existingBrand) {
                return res.render('./admin/addbrand', { error: 'Brand already exists', BrandName: req.body.BrandName });
            }
            
            const savedBrand = await brandmodel.create(req.body);
            res.redirect('/admin/brand');
            //console.log(req.body); 
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    showEditbrand: async (req, res) => {
        const { id } = req.params

        console.log(req.body);
        try {
            const editBrand = await brandmodel.findById({ _id: id })
            res.render('./admin/editbrand', { editBrand })
        } catch (error) {
            console.log(error);
        }
    },
    updatebrand: async (req, res) => {
        const { id } = req.params;
        const { BrandName } = req.body;
        // console.log(req.body)
        try {
            const updatebrand = await brandmodel.findByIdAndUpdate({ _id: id }, { BrandName: BrandName })

            res.redirect('/admin/brand');
        } catch (error) {

            console.error(error);
            res.render('error', { error });
        }
    },
    //     showDeletebrand:async (req, res) => {
    //         const {id}=req.params
    //       //   console.log(id);
    //        await brandmodel.findOneAndDelete({_id:id})
    //       res.redirect("/admin/brand")
    //   },
    blockBrand: async (req, res) => {
        try {
            const brandId = req.params.brandId;
            await brandmodel.findByIdAndUpdate(brandId, { isBlocked: true });
            const brands = await brandmodel.find({});
            const currentPage = parseInt(req.query.page) || 1; // Define currentPage based on the page query parameter
            res.render('./admin/brand', { brands, currentPage });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    unblockBrand: async (req, res) => {
        try {
            const brandId = req.params.brandId;
            await brandmodel.findByIdAndUpdate(brandId, { isBlocked: false });
            const brands = await brandmodel.find({});
            const currentPage = parseInt(req.query.page) || 1; // Define currentPage based on the page query parameter
            res.render('./admin/brand', { brands, currentPage });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    
}
