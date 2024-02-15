const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer')
const otpcontroller = require('../controllers/otpcontroller')
const userController = require('../controllers/usercontroller')
const { userExist, verifyuser } = require('../middleware/userauth')
const userAuth = require("../middleware/userauth");
const User = require('../models/usermodel')
const passwordController = require('../controllers/changepassword')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/ordercontroller')
const cartModel = require('../models/cartModel')
const { uploadSingle } = require('../middleware/multer');
const couponcontroller = require('../controllers/couponcontroller');
router.get('/', userController.showLandpage)
//router.get("/gethome",userAuth.userExist,userController.gethomepage);
//================================search=============================

router.get('/otp', userController.showOtp)
// router.get('/login',userAuth.userExist, userController.getuserloginpage)

router.get('/userlogin', userAuth.userExist, userController.showLoginpage)
router.post('/login', userAuth.userExist, userController.postUserlogin)

router.get('/usersignup', userAuth.userExist, userController.showSignupage)

//=====================================product=================================

router.get('/product/:CategoryName', userController.showProductpage)
router.get('/productdetails/:productId', userController.showProductDeails)

//=======================================================signUp===============
router.get("/home", userAuth.verifyuser, userController.gethomepage)
router.get('/signupp', userAuth.userExist, userController.gethomepage)
router.post("/signupp", userAuth.userExist, userController.signupp)
router.get("/user/tootp", userAuth.userExist, userController.otpSender)
router.post('/otpvalidate', userAuth.userExist, userController.validateOtp)
router.get('/resendOtp', userAuth.userExist, userController.otpSender)

//=====================================forgetpassword=========================

router.get("/forget-pass", userAuth.userExist, userController.toForgotPass)
router.post("/forget-pass", userAuth.userExist, userController.forgotPass)
router.get("/pass-change", userAuth.userExist, userController.toNewpassword)
router.post("/new-pass", userAuth.userExist, userController.passwordReset)
router.get("/tootp", userAuth.userExist, userController.otpSender)



//==========================================================cart======================================================================

router.get('/logout', userAuth.verifyuser, userController.logout)
router.get('/cart', userAuth.verifyuser, cartController.toCart);
router.post('/addToCart', userAuth.verifyuser, cartController.addToCart)
router.post('/removeFromCart/:id', userAuth.verifyuser, cartController.removeCart);
router.get('/getCartInfo', cartController.getCartInfo);
router.post('/updateCartQuantity', cartController.updateCartQuantity)
//router.post('/user/AddToCart/:id',cartController.addlistToCart)
// router.post('/user/updatequantity', cartController.updatequantity)
router.post('/makePurchase',cartController. makePurchase);

//=======================================================profile======================================================


router.get('/profile', userAuth.verifyuser, userController.getprofile)
router.get('/newpassword', userAuth.verifyuser, userController.getnewpassword)
router.get('/addressmanagement', userAuth.verifyuser, userController.getaddressmanagement)
router.post("/addAddress", userAuth.verifyuser, userController.addAddress)
router.post("/editAddress/:id", userAuth.verifyuser, userController.editAddress)
router.post("/deleteAddress/:id", userAuth.verifyuser, userController.deleteAddress)
router.get("/changePass", userAuth.verifyuser, userController.toAccountSettings)
router.post('/change-password', userAuth.verifyuser, passwordController.changePass);
router.post('/uploadProfileImage', uploadSingle.single('profileImage'), userController.userProfile)

router.get("/toCheckout", userAuth.verifyuser, orderController.toCheckout)
router.get("/ordersuccess", userAuth.verifyuser, orderController.success)
router.get('/toOrderPage', userAuth.verifyuser, orderController.toOrderPage)
router.post('/placeOrder', userAuth.verifyuser, orderController.placeOrder)
router.get("/user/toorderDetails/:id", userAuth.verifyuser, orderController.orderDetails)

router.post("/user/cancelOrder/:id", userAuth.verifyuser, orderController.cancelOrder)
router.post('/Onecancel-order', userAuth.verifyuser, orderController.oneItemcancel)
router.post('/return-order', userAuth.verifyuser, orderController.returnOrder)
router.post('/user/verifyPayment', userAuth.verifyuser, orderController.verifyPayment)

router.get('/wallet', userAuth.verifyuser, orderController.wallet)
//router.post('/update-wallet',userAuth.verifyuser,orderController.updateWalletBalance);
router.get('/coupon', userAuth.verifyuser, couponcontroller.couponuserside)
router.post('/applyCoupon', userAuth.verifyuser, couponcontroller.applaycoupon)
//router.post('/getUpdatedTotalAmount',userAuth.verifyuser,couponcontroller.totalamount)
router.get('/nav', userController.nav)
router.get('/search', userController.searchResults)
router.post('/user/addmoneytowallet', userAuth.verifyuser, orderController.addmoneytowallet)

router.post('/downloadinvoice', userAuth.verifyuser, orderController.generateInvoices)
router.get('/downloadinvoice/:orderId', userAuth.verifyuser, orderController.downloadInvoice)
router.post('/submit-review',userAuth.verifyuser,orderController.reviewsubmit)
module.exports = router;