const express = require('express')
const fs = require('fs');

const user = require('../models/users')
const router = express.Router();
const categorymodel = require('../models/category')
const { uploadSingle } = require('../middleware/multer')
module.exports = {

    showCategory: async (req, res) => {
        try {
            const categories = await categorymodel.find({})
            console.log(categories)
            res.render('./admin/category', { categories })
        } catch (error) {
            console.log(error)
        }

    },

    getAddcategory: async (req, res) => {
        try {
            res.render('./admin/addcategory', { error: '' });
        } catch (error) {
            console.log("error");
        }
    },

    postAddcategory: async (req, res) => {
        try {
            const categoryName = req.body.CategoryName;
            req.body.CategoryImage = req.file.filename;
            console.log(req.file);
            const existingCategory = await categorymodel.findOne({ CategoryName: categoryName });
            if (existingCategory) {
                return res.render('./admin/addcategory', { error: 'Category already exists', categoryName });
            }
            // If the category doesn't exist, create a new one
            const savedCategory = await categorymodel.create(req.body);
            res.redirect('/admin/category');
            // console.log(req.body, '///////////////////');
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    showEditcategory: async (req, res) => {
        const { id } = req.params

        // console.log(req.body);
        try {
            const editCategory = await categorymodel.findById({ _id: id })
            res.render('./admin/editcategory', { editCategory })
        } catch (error) {
            console.log(error);
        }

    },
    updateCategory: async (req, res) => {
        const { id } = req.params;
        const { CategoryName } = req.body;
        const trimmedCategoryName = CategoryName.trim();
    
        try {
            if (!trimmedCategoryName || !trimmedCategoryName.length) {
                return res.status(400).send('Please enter a non-empty category name.');
            }
            if (/^\s+$/.test(trimmedCategoryName)) {
                return res.status(400).send('Category name cannot consist of only spaces.');
            }
    
            // Fetch the existing category
            const existingCategory = await categorymodel.findById(id);
    
            const existingCategoryName = existingCategory.CategoryName;
            const existingCategoryImage = existingCategory.CategoryImage;
    
            // If the name is changed, check for duplicates
            if (existingCategoryName.toLowerCase() !== trimmedCategoryName.toLowerCase()) {
                const duplicateCategory = await categorymodel.findOne({
                    CategoryName: { $regex: new RegExp(`^${trimmedCategoryName}$`, 'i') },
                });
    
                if (duplicateCategory) {
                    return res.status(400).send('Category with the same name already exists.');
                }
            }
    
            // Update the category name
            let updatedFields = { CategoryName: trimmedCategoryName };
    
            // Update the category image only if a new image is uploaded
            if (req.file) {
                updatedFields.CategoryImage = req.file.filename;
    
                // Remove the old image file if it exists
                if (existingCategoryImage && fs.existsSync(`../public/upload/${existingCategoryImage}`)) {
                    fs.unlinkSync(`../public/upload/${existingCategoryImage}`);
                }
            }
    
            await categorymodel.findByIdAndUpdate(id, updatedFields);
            res.redirect('/admin/category');
        } catch (error) {
            console.error(error);
            res.render('error', { error });
        }
    },
    

    //     showDelete: async (req, res) => {
    //         const { id } = req.params;

    //         try {
    //             // Find the category to be deleted
    //             const existingCategory = await categorymodel.findById(id);

    //             // Delete the category
    //             await categorymodel.findByIdAndDelete(id);

    //             // If the category had an image, delete it
    //             if (existingCategory && existingCategory.CategoryImage && fs.existsSync(`../public/upload/${existingCategory.CategoryImage}`)) {
    //                 fs.unlinkSync(`../public/upload/${existingCategory.CategoryImage}`);
    //             }

    //             res.redirect('/admin/category');
    //         } catch (error) {
    //             console.error(error);
    //             res.render('error', { error });
    //         }
    //     },
    //  showDelete:async (req, res) => {
    //         const {id}=req.params
    //       //   console.log(id);
    //        await categorymodel.findOneAndDelete({_id:id})
    //       res.redirect("/admin/category")
    //   },
    // Assuming you are using Express.js




    blockCategory: async (req, res) => {
        try {
            const categoryId = req.params.categoryId;
            await categorymodel.findByIdAndUpdate(categoryId, { isBlocked: true });
            const categories = await categorymodel.find({});
            res.render('./admin/category', { categories });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    unblockCategory: async (req, res) => {
        try {
            const categoryId = req.params.categoryId;
            await categorymodel.findByIdAndUpdate(categoryId, { isBlocked: false });
            const categories = await categorymodel.find({});
            res.render('./admin/category', { categories });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
}