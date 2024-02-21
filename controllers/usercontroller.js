
const Users = require("../models/usermodel")
const Admin = require("../models/adminModel");
const sendOTP = require("../controllers/otpcontroller");
const bcrypt = require('bcrypt');
const { model } = require("mongoose")
const Category = require('../models/category')
const Brands = require('../models/brandmodel')
const Otp = require('../models/otpModel')
const productmodel = require('../models/productSchema');
const  banner = require('../models/bannerModel')
const wallet = require('../models/wallet')
const Product = require("../models/productSchema");
const user = require("../models/users");
const categoryoffer=require('../models/categoryOffer')
const productoffer= require('../models/productOffer')
const ReferalData = require("../models/referralOfferModal");
const Review = require("../models/productreviewModel");
const saltRounds = 10;


const userController = {

   generateRefferalId:()=>{
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      id += characters.charAt(randomIndex);
    }
    
    return id;
  },
  
  nav: async (req, res) => {
    try {
      const brands = await Brands.find({});
    
  
      res.render('./user/navbar', { brands});
    } catch (error) {
      console.error('Error:', error);
    }
  },
  searchResults: async (req, res) => {
    try {
      // Extract the search query from the request
      const query = req.query.query;
      
  
      // Search for products in the database based on the search query
      const searchResults = await Product.find({ ProductName: { $regex: query, $options: 'i' } });
      console.log(searchResults, 'result');
  
      // Render the search results page with the searchResults data
      res.render('./user/homepage', { results: searchResults, query: query });
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).send('Internal Server Error');
    }
  },
  
  showLoginpage: (req, res) => {
    if (req.session.user) {
      //console.log("testing............")
      return res.redirect('/home')
    }
    //console.log("testing............2222222222")
    res.render('./user/userlogin')
  },

  showSignupage: (req, res) => {
    res.render('./user/signUp')
  },

  productDetails: (req, res) => {
    res.render('./user/productdetails')
  },


 
  logout: (req, res) => {
    req.session.destroy();
    res.redirect('/');
  },

  showLandpage: async (req, res) => {
    try {
      const brands = await Brands.find({});
      const categories = await Category.find({});
      const product = await productmodel.find({})
      const newarrival = await productmodel.find({ isNewArrival: true, isBlocked: false })
      const banners= await banner.find({})
      res.render('./user/landingpage', { categories, brands, product, newarrival,banners});
    } catch (error) {
      console.error('Error:', error);
    }
  },
  // ===================================================otp======================================================
  showOtp: (req, res) => {

    res.render('./user/otpPage')
  },
  // ==================================================loginnnn===================================================

  // getuserloginpage: (req, res) => {
  //   if(req.session.user)
  //   {
  //     return res.redirect('/user/home')
  //   }
  //   const error = ''
  //   res.render('./user/userlogin', { error })
  // },

  postUserlogin: async (req, res) => {

    const password = req.body.password;
    const emailInput = req.body.emailInput;
    const brands = await Brands.find({});
    const categories = await Category.find({});
    const product = await productmodel.find({})
    const newarrival = await productmodel.find({ isNewArrival: true, isBlocked: false })
    try {
      const user = await Users.findOne({ email: emailInput });
      if (!user) {
        return res.render('./user/userlogin', { error: 'Email not found. Please sign up.' });
      }
      if (user.isBlocked) {
        return res.render('./user/userlogin', { error: 'Your account is blocked!' });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.render('./user/userlogin', { error: 'Incorrect password. Please try again.' });
      }
      //console.log(user, 'userrr............................//////////')
      req.session.user = user
      // console.log(req.session.user, 'sessionnnnnnnnnnn')
      req.session.email = req.body.emailInput;


      res.redirect('/home');

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // =====================================================signuppp==========================================================

  gethomepage: async (req, res) => {
    try {

      const email = req.session.email;
      const user = await Users.findOne({ email: email });
      const brands = await Brands.find({});
      const categories = await Category.find({});
      const product = await productmodel.find({});
      const banners= await banner.find({})
      const newarrival = await productmodel.find({ isNewArrival: true, isBlocked: false });
      req.session.user = user;

      res.render('./user/homepage', { categories, brands, product, newarrival,banners });

    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
    }
  },

  signupp: async (req, res) => {
    try {
        const brands = await Brands.find({});
        const categories = await Category.find({});
        const product = await productmodel.find({})
        const newarrival = await productmodel.find({ isNewArrival: true, isBlocked: false })
        const { username, email, password } = req.body;
        console.log(req.body,'signupp');
        const referralId = req.query.referralId; // Extract referral ID from query parameters

        // Check if the email already exists
        const existingUser = await Users.findOne({ email: email });
        if (existingUser) {
            return res.render('./user/signup', { error: "User already exists. Please log in." });
        }
        req.session.signupdetails = { username, email, password }
console.log(req.session.signupdetails,'dettt');
        hashedPassword = await bcrypt.hash(password, 10);
        const createdOTP = await sendOTP(email);
        console.log(createdOTP, 'otp created');
        req.session.email = email;
        req.session.user = user;
      
        // Redirect to the OTP page
        res.render('./user/otpPage', { email });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
},

validateOtp: async (req, res) => {
  try {
      // Retrieve necessary data for rendering the page
      const brands = await Brands.find({});
      const categories = await Category.find({});
      const product = await productmodel.find({});
      const newarrival = await productmodel.find({ isNewArrival: true, isBlocked: false });

      console.log('verifying otp..');
      const { otp1, otp2, otp3, otp4 } = req.body;
      const enteredOtp = otp1 + otp2 + otp3 + otp4;
      const { username, email, password } = req.session.signupdetails;

      const createdOTPrecord = await Otp.findOne({ email, otp: enteredOtp });
      if (!createdOTPrecord) {
          console.log('Invalid OTP Rendering user/Otp...')
          return res.render('./user/otpPage', { error: 'Invalid OTP' });
      }

      // const referralId = userController.generateRefferalId();
      // console.log(referralId, 'iiiiiiiiii');

      // Check if referral ID exists in the session
      // if (req.session.referralId) {
      //     // Assuming bonusAmount is the bonus given to the referring user
      //     const bonusAmount = 50; // Example bonus amount
      //     // Increment referring user's wallet with referral bonus
      //     const referringUser = await Users.findOneAndUpdate(
      //         { referralId: req.session.referralId },
      //         {
      //             $inc: { 'wallet.balance': bonusAmount },
      //             $push: {
      //                 'wallet.transactions': {
      //                     transactionType: 'credit',
      //                     amount: bonusAmount,
      //                     date: new Date(),
      //                     from: 'Referral bonus',
      //                 },
      //             },
      //         },
      //         { new: true }
      //     );
      //     console.log('Referral bonus added to referring user:', referringUser);
      // }

      // Create user with referral ID
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await Users.create({
          username: username,
          email: email,
          password: hashedPassword,
          // referralId: referralId, Assign generated referral ID
      });

      // Increment the new user's wallet with 100 units
      // const signupBonusAmount = 100; // Example signup bonus amount
      // const updatedNewUser = await Users.findOneAndUpdate(
      //     { _id: newUser._id },
      //     {
      //         $inc: { 'wallet.balance': signupBonusAmount },
      //         $push: {
      //             'wallet.transactions': {
      //                 transactionType: 'credit',
      //                 amount: signupBonusAmount,
      //                 date: new Date(),
      //                 from: 'Sign-up bonus',
      //             },
      //         },
      //     },
      //     { new: true }
      // );

      // console.log('New user saved:', updatedNewUser);

      // Redirect user to home page after successful signup
      req.session.user = newUser.username;
      res.redirect('/home');
  } catch (error) {
      console.error('Error in OTP verification:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
},


  getresentOtp: async (req, res) => {
    try {

      //console.log(email, 'thissssssssssssssssssssss');
      const existingUser = await Users.findOne({ email });
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      const newOTP = generateOTP();
      existingUser.otp = newOTP;
      existingUser.otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
      await existingUser.save();
      sendOTP(email, newOTP);
      return res.render('./user/otpPage', { email, newOTP });
    } catch (error) {
      console.error('Error resending OTP:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },


  toForgotPass: (req, res) => {
    req.session.forgot = true;
    res.render("./user/forget-pass");
  },

  forgotPass: async (req, res) => {
    try {
      // console.log(req.body);
      const check = await Users.findOne({ email: req.body.email });
      console.log(check, 'checkkkkkkkkkkkkkkkkkkkkkkkkkkkk');

      if (check) {
        req.session.email = check.email;
        //console.log("good to go:", check);
        const userdata = {
          email: check.email,
          userName: check.username,
          _id: check._id,
        };
        const email = req.body.email;
        //console.log("Email::: ", email);
        req.session.userdata = userdata;
        req.session.email = email;
        // console.log("Sessiosiiii: ", req.session.email);
        // console.log(req.session.userdata);
        res.json({ success: true });
      } else {
        //console.log(check);
        req.session.err = "no email found";
        res.json({ success: false, message: "email not found" });
      }
    } catch (err) {
      console.log(err);
      req.session.err = "no email found";
      res.json({ success: false, message: "something wrong" });
    }
  },
  toNewpassword: async (req, res) => {
    res.render("./user/new-password");
  },
  passwordReset: async (req, res) => {

    console.log("reached");
    try {
      console.log("this is forget pass reset");
      console.log(req.body);
      console.log("session........", req.session.email);
      const pass = await hashData(req.body.password, 10);
      console.log(pass);
      const email = req.session.email;
      console.log(email);
      const update = await Users.updateOne(
        { Email: email },
        { $set: { Password: pass } }
      );
      // console.log(update);
      req.session.logged = true;
      // req.session.pass_reset = false
      res.json({ success: true });
    } catch (err) {
      console.log(err);
    }
  },
  otpSender: async (req, res) => {
    if (req.session.signotp || req.session.forgot) {
      try {
        //console.log(req.session.email)
        //console.log("otp route")
        const email = req.session.email;
        console.log(email, "lllllllllllllllllllllllllllllllllllllll");
        const createdOTP = await sendOTP(email);
        req.session.email = email;
        console.log('Resending OTP successful');
        // res.json({ status: true, message: 'OTP resent successfully' })
        // console.log("session before verifying otp:", req.session.email);
        res.redirect("/otp");
      } catch (err) {
        console.log(err);
        req.session.err = "sorry we cant send otp at this moment";
        if (req.session.forgot) {
          res.redirect("/forgotPassword");
        }
        res.redirect("/signUp");
      }
    }
  },
  showProductpage: async (req, res) => {
    try {
        const selectedCategoryName = req.params.CategoryName;
        const brands = await Brands.find({});
        const categories = await Category.findOne({ CategoryName: selectedCategoryName });
        const categoryId = categories.id;
        const catoffers = await categoryoffer.find({ });
        const prooffer = await productoffer.find({})
console.log(catoffers,'offerctt');
console.log(prooffer,'prooffrrrrrr');
        const product = await productmodel
            .find({ category: categoryId, isBlocked: false })
            .populate('category')
            .populate('brand');

        const page = parseInt(req.query.page) || 1;
        const transactionsPerPage = 10;
        const startIndex = (page - 1) * transactionsPerPage;
        const endIndex = startIndex + transactionsPerPage;

        const paginatedProducts = product.slice(startIndex, endIndex);
        const currentPage = page;

        res.render('./user/productlist', {
            brands,
            categories,
            selectedCategory: selectedCategoryName,
            product: paginatedProducts,
            currentPage,
            catoffers,
            prooffer 
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error..........');
    }
},

showProductDeails: async (req, res) => {
  try {
    const brands = await Brands.find({});
    const product = await productmodel.find({});
    const productId = req.params.productId;
    const categories = await Category.find({});
    const products = await productmodel.findOne({ _id: productId }).populate('ProductName').populate('category').populate('brand');
  
    const catoffers = await categoryoffer.find({ });

    // Calculate discount amount based on category offers
    let discountAmount = 0;
    if (catoffers && catoffers.length > 0 && products && products.price) {
      const categoryOffer = catoffers.find(offer => offer.categoryName === products.category.CategoryName);
      const offerPercentage = categoryOffer && categoryOffer.percentage > 0 ? categoryOffer.percentage : 0;
      if (offerPercentage > 0) {
        // Calculate the discounted price
        const discountedPrice = products.price - (products.price * offerPercentage) / 100;
        // Calculate the discount amount
        discountAmount = products.price - discountedPrice;
      }
    }
    const reviews = await Review.find({ productId }).exec();
    await productmodel.findByIdAndUpdate(productId, { discountAmount: discountAmount });

    res.render('./user/productdetails', { products, categories, brands, catoffers, reviews });
  } catch (error) {
    console.log(error, 'error');
  }
},

  addAddress: async (req, res) => {
    try {
      const email = req.session.email;
      // console.log(req.body);
      let newAddress = {
        name: req.body.name,
        addressLine: req.body.address,
        city: req.body.city,
        pinCode: req.body.pincode,
        state: req.body.state,
        MobileNumber: req.body.number,
      }
      const user = await Users.findOne({ email: email })
      user.Address.push(newAddress)
      await user.save();
      res.json({ success: true })

    } catch (err) {
      console.log(err);
    }
  },

  getprofile: async (req, res) => {
    try {
        const email = req.session.email;
        const brands = await Brands.find({});
        const userData = await Users.findOne({ email: email });

        if (!userData) {
            return res.status(404).send("User not found");
        }

        // Fetch the referring user based on the referralId
        const referringUser = await Users.findOne({ referralId: userData.referralId });
        let referredByEmail = null;
        if (referringUser) {
            referredByEmail = referringUser.email;
        }

        const referralLink = `${req.protocol}://${req.get('host')}/usersignup/?=referral=${userData.referralId}`;

        req.session.user = userData;

        res.render('./user/profile', { userData, brands, referralLink, referredByEmail });
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Internal Server Error");
    }
},

  userProfile: async (req, res) => {
    try {
      // console.log("user Profile section");
      if (req.file) {
        const updatedUser = await Users.findOneAndUpdate(
          { Email: req.session.email },
          { profilePhoto: req.file.filename },
          { new: true }
        );

        if (updatedUser) {
          console.log("updated");
          res.status(200).json({ message: 'Profile photo updated successfully' });
        } else {
          res.status(404).json({ error: 'User not found' });
        }
      } else {
        res.status(400).json({ error: 'No file was uploaded' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  editAddress: async (req, res) => {
    try {
      const addresssId = req.params.id;
      const updatedAdress = {
        name: req.body.name,
        addressLine: req.body.address,
        city: req.body.city,
        pinCode: req.body.pincode,
        state: req.body.state,
        MobileNumber: req.body.number,
      }
      const user = await Users.findOneAndUpdate(
        { 'Address._id': addresssId },
        { $set: { 'Address.$': updatedAdress } },
        { new: true },
      )
      if (user) {
        res.redirect("/addressmanagement")
      }
    } catch (error) {
      console.log("error editing address", error);
    }
  },
  toAccountSettings: (req, res) => {
    try {
      res.render('user/account-setting', { title: "account Settings" })
    } catch (error) {
      res.send('error', error)
    }
  },


  getnewpassword: (req, res) => {
    res.render('./user/newpassword')
  },
  getaddressmanagement: async (req, res) => {
    try {
      const email = req.session.email;
      const userData = await Users.findOne({ email: email })

      res.render('./user/addressManage', { userData, user: userData })
    } catch (error) {
      console.log(error);
    }
  },


  deleteAddress: async (req, res) => {
    try {
      const email = req.session.email;
      const adressId = req.params.id;
      const user = await Users.findOne({ email: email })
      if (!user) {
        return res.status(404).json({ message: "user not found" })
      }
      const addressIndex = user.Address.findIndex((address) => address._id.toString() === adressId);
      if (addressIndex === -1) {
        return res.status(404).json({ message: "Adress not found" })
      }
      user.Address.splice(addressIndex, 1)
      await user.save();
      res.status(200).json({ success: true, message: "address deleted successfully" })
    } catch (error) {
      console.log("error deleting address", error);
    }
  },
  



 

};



module.exports = userController;