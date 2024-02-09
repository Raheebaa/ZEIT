const category = require('../models/category');
const users = require("../models/usermodel");
const Category = require("../models/category");
const productUpload = require("../models/productSchema");
const Order = require("../models/orderModel"); // Import the Order model
const orders = require('../models/orderModel');
const Return = require("../models/return")
const Banner = require('../models/bannerModel');

const adminCredential = {
  email: 'zeit@gmail.com',
  password: 'zeit'
}

const adminController = {
  showAdminpage: (req, res) => {
    if (!req.session.isAdmin) {
      res.render('./admin/adminlog');
    } else {
      res.redirect("/admin")
    }
  },
  adminlogg: (req, res) => {

    const { email, password } = req.body;
    console.log('Received email:', email);
    console.log('Received password:', password);

    if (email === adminCredential.email && password === adminCredential.password) {

      req.session.isAdmin = true;
      res.redirect('/admin/admindash');
    } else {
      console.log('Login failed. Invalid credentials.');
      res.send('Invalid credentials. Please try again.');
    }
  },
  showDashpage: async (req, res) => {
    try {
      const totalOrders = await Order.find().countDocuments();
      const totalUsers = await users.countDocuments();

      res.render('./admin/dashboard', { totalOrders, totalUsers });
    } catch (error) {
      console.error("Error fetching total orders and total users:", error);
      res.render('./admin/dashboard', { totalOrders: 0, totalUsers: 0 });
    }
  },

  showProductpage: (req, res) => {
    res.render('./admin/product');
  },
  showBrandpage: (req, res) => {
    res.render('./admin/brands');
  },
  showAddproductpage: (req, res) => {
    res.render('./admin/addproduct');
  },


  toEditcategory: (req, res) => {
    res.redirect("./admin/edit-category");
  },

  toDashBoard: (req, res) => {
    res.render("./admin/dashboard", { title: "dashboard" });
  },
  logout: (req, res) => {
    res.render('./admin/adminlog')
  },

  toOrders: async (req, res) => {
    try {
      var i = 0
      const page = parseInt(req.query.page) || 1;
      const count = await orders.find().count()
      const pageSize = 10;
      const totaldata = Math.ceil(count / pageSize);
      const skip = (page - 1) * pageSize;
      const data = await orders.find().sort({ OrderDate: -1 }).skip(skip).limit(pageSize)
      const returns = await Return.find().sort({ returnDate: -1 })
      console.log(returns);

      res.render('./admin/orders', {
        title: 'Orders', orderData: data,
        Count: totaldata,
        page: page,
        i,
        returns,
      })
    } catch (err) {
      console.log(err);
    }
  },

  async fetchOrderDetails(orderId) {
    try {
      const orderDetails = await Order.findById(orderId);
      return orderDetails;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error; // Propagate the error to the calling function
    }
  },

  orderview: async (req, res) => {
    try {
      const orderId = req.params.id;
      const user = await users.findOne({ email: req.session.email });

      console.log(orderId);

      // Assuming you're using Mongoose for MongoDB interactions
      const orderData = await Order.findOne({ _id: orderId }).populate('Items.productId');


      // Replace 'OrderModel' with the actual model you are using to store orders

      res.render('./admin/OrderDetialsView', { orderData, userData: user, title: "orderview" });
    } catch (error) {
      console.error("order view getting some errors ", error);
      res.send('nooooooooooooooooo');
    }
  },

  orderStatus: async (req, res) => {
    try {
      const orderId = req.params.orderId;
      //   console.log('mmmmmmmmm',orderId);
      const newStatus = req.body.status;
      //   console.log('>>>>>>>>>>>>>',newStatus);  
      const order = await orders.findByIdAndUpdate(orderId, { Status: newStatus });

      // console.log('...............',order);
      if (order) {
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    } catch (error) {
      console.log("Updating status error");
      res.send('error', error)
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },
  categoryOffer: async (req, res) => {
    try {
      const categories = await Category.find(); // Fetch categories from your database
      res.render('./admin/categoryoffer', { categories });
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).send('Internal Server Error');
    }
  },
  banner:async (req, res) => {
    try {
        const banners = await Banner.find({})
     
        res.render('./admin/banner', { banners })
    } catch (error) {
        console.log(error)
    }

},

getAddbanner: async (req, res) => {
  try {
      res.render('./admin/addbanner', { error: '' });
  } catch (error) {
      console.log("error");
  }
},

postAddbanner: async (req, res) => {
  try {
   
      req.body.imageUrl = req.file.filename;
      console.log(req.file);

      // If the category doesn't exist, create a new one
      const savedCategory = await Banner.create(req.body);
      res.redirect('/admin/banner');
      // console.log(req.body, '///////////////////');
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
  }
},

deleteBanner: async (req, res) => {
  try {
      const bannerId = req.params.bannerId;
      // Delete the banner from the database
      await Banner.findByIdAndDelete(bannerId);
      res.sendStatus(200);
  } catch (error) {
      console.error('Error deleting banner:', error);
      res.status(500).send('Internal Server Error');
  }
}

};

module.exports = adminController;
