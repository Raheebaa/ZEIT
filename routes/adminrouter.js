const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admincontroller');
const dashController = require('../controllers/dashcontroller');
const users = require('../models/usermodel');

const { uploadSingle, upload } = require('../middleware/multer');

const adminAuth = require('../middleware/adminauth');
const categorycontroller = require('../controllers/categorycontroller');
const brandcontroller = require('../controllers/brandcontroller')
const customercontroller = require('../controllers/customercontroller')
const productController = require('../controllers/productcontroller')
const couponcontroller = require('../controllers/couponcontroller')
const offerController = require('../controllers/offerController')
router.get('/', adminController.showAdminpage);

router.post('/adminlog', adminAuth.adminExist, adminController.adminlogg);
router.get('/admindash', adminAuth.verifyadmin, adminController.showDashpage)
router.get('/logout', adminAuth.verifyadmin, adminController.logout)




//======================================= category==============================================================
router.get('/category', adminAuth.verifyadmin, categorycontroller.showCategory)
router.get('/addcategory', adminAuth.verifyadmin, categorycontroller.getAddcategory)
router.post('/addcategory', adminAuth.verifyadmin, uploadSingle.single('CategoryImage'), categorycontroller.postAddcategory);
router.get('/editcategory/:id', adminAuth.verifyadmin, categorycontroller.showEditcategory)
router.post('/editcategory/:id', adminAuth.verifyadmin, uploadSingle.single('CategoryImage'), categorycontroller.updateCategory);
// router.get('/deletecategory',categorycontroller.showDeletecategory);
//router.get('/deletecategory/:id', categorycontroller.showDelete);
router.post('/blockcategory/:categoryId', adminAuth.verifyadmin, categorycontroller.blockCategory);
router.post('/unblockcategory/:categoryId', adminAuth.verifyadmin, categorycontroller.unblockCategory);


// ===============================================brand======================================================


router.get('/brand', adminAuth.verifyadmin, brandcontroller.showBrand)
router.get('/addbrand', adminAuth.verifyadmin, brandcontroller.getAddbrand)
router.post('/addbrand', adminAuth.verifyadmin, brandcontroller.postAddbrand);
router.get('/editbrand/:id', adminAuth.verifyadmin, brandcontroller.showEditbrand)
router.post('/editbrand/:id', adminAuth.verifyadmin, brandcontroller.updatebrand);
router.post('/blockbrand/:brandId', adminAuth.verifyadmin, brandcontroller.blockBrand);
router.post('/unblockbrand/:brandId', adminAuth.verifyadmin, brandcontroller.unblockBrand);


// ======================================================cutomer=============================================


router.get('/Customers', adminAuth.verifyadmin, customercontroller.showCustomer)
router.post('/block/:userId', adminAuth.verifyadmin, customercontroller.blockUser);
router.post('/unblock/:userId', adminAuth.verifyadmin, customercontroller.unblockUser)

// ==================================================product==================================================


router.get('/product', adminAuth.verifyadmin, productController.showProduct)
router.get('/addproduct', adminAuth.verifyadmin, productController.getAddproduct)
router.get('/editProduct/:productId', adminAuth.verifyadmin, productController.showeditproduct);
router.post('/editProduct/:productId', upload.fields([{ name: 'image0', maxCount: 1 }, { name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image4', maxCount: 1 }]), productController.updateProduct)
router.post('/addproduct', upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }, { name: 'image3', maxCount: 1 }, { name: 'image4', maxCount: 1 }]), productController.postAddproduct)
router.post('/blockproduct/:productId', adminAuth.verifyadmin, productController.blockProduct);
router.post('/unblockproduct/:productId', adminAuth.verifyadmin, productController.unblockProduct);
router.post("/updateQuantity", productController.updateQuantity);
router.post('/saveReview', productController.saveReview)
//====================================================orders===================================================
router.get('/orders', adminAuth.verifyadmin, adminController.toOrders)
router.get('/viewOrder/:id', adminAuth.verifyadmin, adminController.orderview);
router.put('/updateStatus/:orderId', adminAuth.verifyadmin, adminController.orderStatus)


//===============================================sales==========================================

// router.get("/count-orders-by-day",adminAuth.verifyadmin,dashController.salesReport)
router.get("/sales-report'", adminAuth.verifyadmin, dashController.salesReport)
router.get('/orderView/:id', adminAuth.verifyadmin, adminController.orderview)
router.get("/count-orders-by-day", adminAuth.verifyadmin, dashController.salesReport)
router.get("/count-orders-by-month", adminAuth.verifyadmin, dashController.salesReport)
router.get("/count-orders-by-year", adminAuth.verifyadmin, dashController.salesReport)
router.get('/latestOrders', adminAuth.verifyadmin, dashController.getOrdersAndSellers)
router.post('/download-sales-report', adminAuth.verifyadmin, dashController.generateSalesReport)


//==================================================coupon====================================

router.get('/coupon', adminAuth.verifyadmin, couponcontroller.getcoupon)
router.get('/addcoupon', adminAuth.verifyadmin, couponcontroller.addcoupon)
router.post('/addcoupon', adminAuth.verifyadmin, couponcontroller.postaddcoupon)
router.get('/editcoupon/:id', adminAuth.verifyadmin, couponcontroller.geteditcoupon)
router.post('/updatecoupon/:id', adminAuth.verifyadmin, couponcontroller.posteditcoupon)
router.get('/deletecoupon/:id', adminAuth.verifyadmin, couponcontroller.deletecoupon)



//================================offers=========================================
router.get("/offers", adminAuth.verifyadmin, offerController.toOffer)
router.get("/categoryOffers", adminAuth.verifyadmin, offerController.categoryOffers)
router.post("/addOffer", adminAuth.verifyadmin, offerController.addOffer)
router.post("/editProductOffer/:id", adminAuth.verifyadmin, offerController.editProductOffer)
router.get("/deleteOffer/:id", adminAuth.verifyadmin, offerController.deleteProductOffer)
router.post("/addCategoryOffer", adminAuth.verifyadmin, offerController.addCategoryOffer)
router.post("/editCategoryOffer/:id", adminAuth.verifyadmin, offerController.editCategoryOffer)
router.get("/deleteCategoryOffer/:id", adminAuth.verifyadmin, offerController.deleteCategoryOffer)


//=======================================referal===============================

router.get("/referral", adminAuth.verifyadmin, offerController.referalOffers)
router.post("/editReferal", adminAuth.verifyadmin, offerController.EditReferal)
router.get("/disableReferalOffers", adminAuth.verifyadmin, offerController.DisableReferalOffers)
router.get("/enableReferalOffers", adminAuth.verifyadmin, offerController.EnableReferalOffers)

//=======================================banner================================
router.get('/banner', adminAuth.verifyadmin, adminController.banner)
router.get('/addbanner', adminAuth.verifyadmin, adminController.getAddbanner)
router.post('/addbanner', adminAuth.verifyadmin, uploadSingle.single('imageUrl'), adminController.postAddbanner);
router.delete('/deletebanner/:bannerId', adminAuth.verifyadmin, adminController.deleteBanner);

module.exports = router;
