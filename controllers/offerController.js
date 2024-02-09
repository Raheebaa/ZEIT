const ProductOffers = require("../models/productOffer");
const Category = require("../models/category");
const CategoryOfferSchema = require("../models/categoryOffer");
const productUpload = require("../models/productSchema");
const ReferalOffers = require("../models/referralOfferModal");
const cron = require("node-cron");
cron.schedule("* * * * * *", async () => {
    try {
      const currentDate = new Date();
  
      const catUpdate = await CategoryOfferSchema.updateMany(
        {
          endDate: { $lt: currentDate },
        },
        { $set: { Status: false } }
      );
  
      const productOffers = await ProductOffers.find();
  
      const updateProductOffersPromises = productOffers.map(async (productOffer) => {
        if (productOffer.endDate < currentDate) {
          await ProductOffers.findByIdAndUpdate(
            productOffer._id,
            { $set: { Status: false } },
            { new: true }
          );
        }
      });
  
      await Promise.all(updateProductOffersPromises);
  
    } catch (error) {
      console.error("Error updating offers:", error);
    }
  });
  
  const toOffer = async (req, res) => {
    try {
      const offer = await ProductOffers.find();
      const Products = await productUpload.find();
      
      res.render("admin/ProductOffer", {
        offer,
        Products,
        title: "Product Offers",
      });
    } catch (error) {}
  };
  const categoryOffers = async (req, res) => {
    try {
      const categoryData = await Category.find();
      const offerData = await CategoryOfferSchema.find();
      res.render("admin/CategoryOffer", {
        categoryData,
        offerData,
        title: "Category Offers",
      });
    } catch (error) {}
  };
  const referalOffers = async (req, res) => {
    try {   
      const Referaldata = await ReferalOffers.findOne();
      res.render("./admin/ReferalOffers",{Referaldata,title:"referral offers"})
    } catch (error) {
      console.log(error)
    }
  };
  const DisableReferalOffers=async(req,res)=>{
    try {
      const Referaldata = await ReferalOffers.findOneAndUpdate({Status:false});
      res.json({ status: true});
    } catch (error) {
      console.log(error)
    }
  }
  const EnableReferalOffers=async(req,res)=>{
    try {
      const Referaldata = await ReferalOffers.findOneAndUpdate({Status:true});
      res.json({ status: true});
    } catch (error) {
      console.log(error)
    }
  }
  
  
  const EditReferal=async(req,res)=>{
    try {
      console.log("reached");
      const newBprice=req.body.newBonusPrice
      const Referaldata = await ReferalOffers.findOneAndUpdate({BonusPrice:newBprice});
      if(Referaldata){
        res.json({ status: true,message:"Bonus Price Updated Succesfully"});
      }else{
        res.json({ status: false,message:"Error while Updating Bonus Price !"});
      }
    } catch (error) {
      res.json({ status: false,message:"Error while Updating Bonus Price !"});
      console.log(error)
    }
  }
  const addOffer = async (req, res) => {
    try {
      const { productName, endDate, offerPercentage } = req.body;
      const existingProductOffer = await ProductOffers.findOne({
        Productname: productName,
      });
      if (existingProductOffer) {
        return res.json({
          success: false,
          err: "offer already exist on this product",
        });
      }
  
      if (!productName || !endDate || !offerPercentage) {
        return res.status(400).json({ err: "Invalid input" });
      }
  
      const newOffer = new ProductOffers({
        Productname: productName,
        startDate: Date.now(),
        endDate: new Date(endDate),
        offerPercentage:offerPercentage,
      });
  
      const savedOffer = await newOffer.save();
  
      const product = await productUpload.findOne({ ProductName: productName });
      const discountPercentage = parseFloat(offerPercentage);
      const discountMultiplier = 1 - discountPercentage / 100;
  
      if (product) {
         
        const originalPrice = product.DiscountAmount;
        const discountedPrice = Math.ceil(originalPrice * discountMultiplier);
  
        product.DiscountPrice = discountedPrice;
        product.DiscountPercentage = discountPercentage;
        product.isOffer = true;
        product.OfferType = "productOffer";
  
        const savedProduct = await product.save();
  
        return res.json({ success: true });
      } else {
        return res.json({ success: false, err: "product not found " });
      }
    } catch (error) {
  
    }
  };
  const editProductOffer = async(req,res)=>{
      try {
          const offerId = req.params.id;
          
  
      const updatedProductOffer = await ProductOffers.findByIdAndUpdate(
        offerId,
        {
          Productname: req.body.productName,
          offerPercentage: req.body.offerPercentage,
          endDate: req.body.endDateEdit,
        },
        { new: true }
      );
  
      if (!updatedProductOffer) {
        return res.json({success:false,err:"offer not found"})
      }
  
      const product = await productUpload.findOne({ ProductName: updatedProductOffer.Productname });
  
      if (product) {
        const originalPrice = product.Price;
        const discountPercentage = parseFloat(updatedProductOffer.offerPercentage);
        const discountMultiplier = 1 - discountPercentage / 100;
        const discountedPrice = Math.ceil(originalPrice * discountMultiplier);
  
        product.DiscountPrice = discountedPrice;
        product.DiscountPercentage = discountPercentage;
  
        await product.save();
          return res.json({success:true})
      }
      } catch (error) {
          console.log(error)
      }
  }
  const deleteProductOffer = async(req,res)=>{
      try {
          const offerId = req.params.id;
          const productOffer = await ProductOffers.findById(offerId);
      
  
          const product = await productUpload.findOne({ Name: productOffer.Productname });
      
          if (product) {
            const categoryOffer = await CategoryOfferSchema.findOne({ CategoryName: product.Category });
      
            if (categoryOffer) {
              const originalPrice = product.Price;
              const discountPercentage = parseFloat(categoryOffer.OfferPersentage);
              const discountMultiplier = 1 - discountPercentage / 100;
              const discountedPrice = Math.ceil(originalPrice * discountMultiplier);
      
              product.DiscountPrice = discountedPrice;
              product.DiscountPercentage = discountPercentage;
              product.isOffer = true;
              product.Offertype = 'categoryoffer';
      
              await product.save();
            } else {
              product.DiscountPrice = 0;
              product.DiscountPercentage = 0;
              product.isOffer = false;
              product.OfferType = 'none';
      
              await product.save();
            }
          }
      
          await ProductOffers.findByIdAndDelete(offerId);
      
          res.redirect("/admin/offers")
      } catch (error) {
          console.log(error);
      }
  }
  const addCategoryOffer = async (req,res)=>{
      try {
          // console.log(req.body)
          const categoryentered = req.body.categoryName;
          const productdata = await productUpload.find({ Category: categoryentered });
      
          const existingCategoryOffer = await CategoryOfferSchema.findOne({ categoryName: categoryentered });
      
          if (existingCategoryOffer) {
            return res.json({success:false,err:" An offer already exist for this category"})
             
          }
      
          const newCategoryOffer = new CategoryOfferSchema({
              categoryName: req.body.categoryName,
              percentage: req.body.offerPercentage,
              endDate: req.body.endDate,
              startDate: Date.now(),
          });
      
          const savedCategory = await newCategoryOffer.save();
  
          console.log(savedCategory)
      
          const discountPercentage = parseFloat(req.body.offerPercentage);
          const discountMultiplier = 1 - discountPercentage / 100;
      
          const updatePromises = productdata.map(async (product) => {
            if (product.OfferType !== 'productOffer') {
              const originalPrice = product.Price;
              const discountedPrice = Math.ceil(originalPrice * discountMultiplier);
      
              product.DiscountPrice = discountedPrice;
              product.DiscountPercentage = discountPercentage;
              product.isOffer = true;
              product.OfferType = 'categoryoffer';
      
              return product.save();
            } else {
              return Promise.resolve();
            }
          });
      
          await Promise.all(updatePromises);
      
          res.json({success:true})
        } catch (error) {
          console.log(error);
        }
  }
  const editCategoryOffer = async(req,res)=>{
      try {
          const offerId = req.params.id;
      
          const updatedCategoryOffer = await CategoryOfferSchema.findByIdAndUpdate(
            offerId,
            {
              categoryName: req.body.categoryName,
              percentage: req.body.offerPercentage,
              endDate: req.body.endDateEdit,
            },
            { new: true }
          );
      
          if (!updatedCategoryOffer) {
            res.json({success:false})
          }
          
          const productsInCategory = await productUpload.find({ Category: updatedCategoryOffer.categoryName, OfferType: 'categoryoffer' });
      
          const updateProductsPromises = productsInCategory.map(async (product) => {
            if (product.OfferType !== 'productOffer') {
              const originalPrice = product.DiscountAmount;
              const discountPercentage = parseFloat(updatedCategoryOffer.percentage);
              const discountMultiplier = 1 - discountPercentage / 100;
              const discountedPrice = Math.ceil(originalPrice * discountMultiplier);
      
              product.DiscountPrice = discountedPrice;
              product.DiscountPercentage = discountPercentage;
      
              return product.save();
            } else {
              return Promise.resolve();
            }
          });
      
          await Promise.all(updateProductsPromises);
      
         res.json({success:true})
        } catch (error) {
          console.log(error);
        }
  }
  const deleteCategoryOffer =async (req,res)=>{
      try {
          const offerId = req.params.id;
          const categoryOffer = await CategoryOfferSchema.findById(offerId);
      
         if(!categoryOffer){
          console.log("couldnt find the offer");
         }
      
          const productsInCategory = await productUpload.find({ Category: categoryOffer.categoryName });
      
          // Update each product in the category
          const updateProductsPromises = productsInCategory.map(async (product) => {
            if (product.OfferType === 'categoryoffer') {
              product.DiscountPrice = 0;
              product.DiscountPercentage = 0;
              product.isOffer = false;
              product.OfferType = 'none';
      
              await product.save();
            }
          });
      
          await Promise.all(updateProductsPromises);
      
          await CategoryOfferSchema.findByIdAndDelete(offerId);
      
          res.redirect("/admin/categoryOffers")  
      } catch (error) {
         console.log(error)
      }
  }
  
  module.exports = {
    toOffer,
    categoryOffers,
    addOffer,
    editProductOffer,
    deleteProductOffer,
    addCategoryOffer,
    editCategoryOffer,
    deleteCategoryOffer,
    referalOffers,
    EditReferal,
    DisableReferalOffers,
    EnableReferalOffers,
  
  };
  
  