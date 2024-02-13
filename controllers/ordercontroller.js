const cart = require("../models/cartModel");
const Users = require("../models/usermodel");
const order = require("../models/orderModel");
const Brands = require("../models/brandmodel");
const productUpload = require("../models/productSchema");
const Return = require("../models/return");
const walletmodel = require('../models/wallet')
const razorpay = require('razorpay');
const Review=require('../models/productreviewModel')
const { createHmac } = require("crypto");
const { generateInvoice } = require("../services/easyInvoice");

const { default: mongoose } = require("mongoose");
const Orders = require("../models/orderModel");
const Razorpay = require('razorpay');
const Coupon = require("../models/coupen");

const rzp = new Razorpay({
  key_id: "rzp_test_9oVCk3W2kwsPv6",
  key_secret: "bmanhgrzIh1odJegp9XKz3Mw",

});
require("dotenv").config()
async function updateProductStock(productId, purchasedQuantity, cartDetails) {
  try {
    const product = await productUpload.findById(productId);

    if (!product) {
      console.error('Product not found:', productId);
      return;
    }

    // Update the product stock based on the purchased quantity
    product.stock -= purchasedQuantity;

    // Save the updated product
    await product.save();
  } catch (error) {
    console.error('Error updating product stock:', error);
  }
}


module.exports = {
  toCheckout: async (req, res) => {
    try {
      const email = req.session.email;
      const brands = await Brands.find({});
      const userData = await Users.findOne({ email: req.session.email });
      const Cart = await cart.findOne({ userId: userData._id });
      const userWallet = await walletmodel.findOne({ userId: userData._id });
  
      if (!Cart) {
        return res.render("user/checkoutPage", { error: "Cart not found" });
      }

    
      const TotalPrice = Cart.TotalAmount;
     
      const walletBalance = userWallet ? userWallet.balance : 0;
      // console.log(walletBalance, 'wwwwwwwwwwwwwwwwwww');
      req.session.user = userData;
      return res.render("user/checkoutPage", { userData, Cart, TotalPrice, walletBalance, brands });
    } catch (error) {
      console.error("Error in toCheckout:", error);
      return res.render("user/checkoutPage", { error: "Error fetching data" });
    }
  },
  placeOrder: async (req, res) => {
    try {
        const email = req.session.email;
        const userData = await Users.findOne({ email: email });

        if (!userData || !userData._id) {
            return res.status(400).json({
                success: false,
                message: "User data is missing or invalid",
            });
        }

        req.session.user = userData;

        const userId = userData._id;
        console.log(userId, 'USERID');
        const Cart = await cart.findOne({ userId: userId });

        if (!Cart || !Cart.TotalAmount) {
            return res.status(400).json({
                success: false,
                message: "Cart data is missing or invalid",
            });
        }

        const userWallet = await walletmodel.findOne({ userId: userId });

        let TotalPrice = Cart.TotalAmount; // Set TotalPrice to the default Cart total amount

        const selectedAddressId = req.body.selectedAddress;
        const paymentMethod = req.body.selectedPaymentMethod;

        let savedOrder;

        // Check if there is an updatedTotalAmount sent from the frontend
        const updatedTotalAmount = parseFloat(req.body.updatedTotalAmount);
        if (!isNaN(updatedTotalAmount) && updatedTotalAmount > 0) {
            TotalPrice = updatedTotalAmount;
        }
        let walletBalance = userWallet ? userWallet.balance : 0;
      // Check if the selected payment method is "wallet"
      if (paymentMethod === "wallet") {
        if (TotalPrice > walletBalance) {
          return res.status(400).json({
            success: false,
            message: "Insufficient wallet balance for this order",
          });
        }
        // Deduct the order amount from the wallet balance
        walletBalance -= TotalPrice;
      }
      // Save the updated user data
      if (userWallet) {
        userWallet.balance = walletBalance;
        await userWallet.save();

        // Add a transaction to represent the debit
        if (paymentMethod === "wallet") {

          userWallet.transactions.push({
            transactionType: 'debit',
            amount: TotalPrice,
            date: new Date(),
            from: 'order payment',
          });
          await userWallet.save();
        }
      }

      const selectedAddress = userData.Address.find(
        (address) => address._id == selectedAddressId
      );

      if (!selectedAddress) {
        return res.status(400).json({
          success: false,
          message: "Selected address not found",
        });
      }
      const cartDetails = await cart.findOne({ userId: userId });
      const newOrder = new order({
        Status: "Pending",
        paymentStatus: paymentMethod === "online" || paymentMethod === "wallet" ? "paid" : "pending",
        Items: cartDetails.items,
        UserID: userId,
        paymentMethod: paymentMethod,
        Address: {
          name: selectedAddress.name,
          addressLine: selectedAddress.addressLine,
          city: selectedAddress.city,
          pincode: selectedAddress.pinCode,
          state: selectedAddress.state,
          mobileNumber: selectedAddress.MobileNumber,
        },
        TotalAmount: cartDetails.TotalAmount,
        OrderDate: new Date(),
      });

      savedOrder = await newOrder.save();

      if (savedOrder) {
        await cart.findOneAndDelete({ userId: userId });

        for (const item of savedOrder.Items) {
          const productId = item.productId;
          const purchasedQuantity = item.quantity;

          await updateProductStock(productId, purchasedQuantity, cartDetails);
        }
      }
      if (paymentMethod === "online") {
        const razorpayInstance = new razorpay({
          key_id: 'rzp_test_9oVCk3W2kwsPv6',
          key_secret: 'bmanhgrzIh1odJegp9XKz3Mw',
        });

        const orderOptions = {
          amount: TotalPrice * 100, // Amount in paisa
          currency: "INR",
          receipt: savedOrder._id.toString(),
        };

        try {
          const razorpayOrder = await razorpayInstance.orders.create(orderOptions);
          console.log(razorpayOrder, 'razorpayorderrr');
          res.json({
            success: true,
            online: true,
            razorpayOrder,
            savedOrder,
          });

        } catch (razorpayError) {
          console.error('Razorpay order creation failed:', razorpayError);
          return res.status(500).json({
            success: false,
            message: 'Error creating Razorpay order',
            razorpayError,
          });
        }
      } else {

        res.json({
          success: true,
          message: "Order placed successfully",
          walletBalance: userWallet.balance,
        });
      }
    } catch (error) {
      console.error("Error placing the order:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
  success: async (req, res) => {
    const userData = await Users.findOne({ email: req.session.email });
    req.session.user = userData;
    res.render("./user/orderSuccess");
  },
  toOrderPage: async (req, res) => {
    try {

      const userData = await Users.findOne({ email: req.session.email });
      const brands = await Brands.find({});
      const page = parseInt(req.query.page) || 1;
      const transactionsPerPage = 10;

      if (!userData) {
        // Handle the case where the user is not found
        return res.render("user/Orders", { error: "User not found" });
      }
      const userId = userData._id;
      const orderData = await order.find({ UserID: userId }).populate('Items.productId').sort({ OrderDate: -1 });
      // Calculate startIndex and endIndex for pagination
      const startIndex = (page - 1) * transactionsPerPage;
      const endIndex = startIndex + transactionsPerPage;
      // Use slice to get the paginated orders
      const paginatedOrderData = orderData.slice(startIndex, endIndex);
      // Define currentPage based on the page query parameter
      const currentPage = page;
      req.session.user = userData;
      res.render('user/Orders', { title: 'Orders', orderData: paginatedOrderData, userData, currentPage, brands });
    } catch (error) {
      console.error("Error in orders:", error);
      return res.render("user/Orders", { error: "Error fetching data" });
    }
  },
  orderDetails: async (req, res) => {
    try {
      const user = await Users.findOne({ email: req.session.email })
      const orderId = req.params.id;
      const brands = await Brands.find({});
      const orderData = await order.find({ _id: orderId }).populate('Items.productId');
  
      // Extract productId from orderData
      const productId = orderData[0].Items[0].productId._id; // Adjust according to your data structure
  console.log(productId,'proidd');
      res.render('user/orderDetails', { orderData, userData: user, brands, productId });
    } catch (error) {
      console.error("Error in orders:", error);
      return res.render("user/orderDetails", { error: "Error fetching data" });
    }
  },
  
  cancelOrder: async (req, res) => {
    try {
      const orderId = req.params.id;
      const orderData = await order.findById(orderId);

      if (orderData.Status !== 'Delivered') {
        const originalStatus = orderData.Status; // Save the original status for later use
        orderData.Status = 'Cancelled';

        // Check if the payment method was "wallet" or "online"
        if (orderData.paymentMethod === 'wallet' || orderData.paymentMethod === 'online') {
          const userId = orderData.UserID;
          const userWallet = await walletmodel.findOne({ userId: userId });

          if (userWallet) {
            // Add the canceled order amount back to the wallet balance
            userWallet.balance += orderData.TotalAmount;

            // Save the updated wallet document
            await userWallet.save();

            // Add a transaction to represent the credit
            userWallet.transactions.push({
              transactionType: 'credit',
              amount: orderData.TotalAmount,
              date: new Date(),
              from: 'order cancellation',
              orderId: orderId,
            });

            await userWallet.save();
            await Orders.findOneAndUpdate({ _id: orderId }, { paymentStatus: 'refunded' });
          }
        }

        await orderData.save();

        for (const item of orderData.Items) {
          if (item.productId) {
            const product = await productUpload.findById(item.productId);

            if (product) {
              // Increase the product stock based on canceled order item quantity
              product.AvailableQuantity += item.quantity;
              await product.save();
            }
          }
        }

        return res.json({ success: true, message: 'Order has been canceled', originalStatus });
      } else {
        return res.json({ success: false, message: 'Cannot cancel a delivered order' });
      }
    } catch (error) {
      console.log('Error canceling order:', error);
      return res.status(500).json({ success: false, message: 'An error occurred while canceling the order' });
    }
  },
  oneItemcancel: async (req, res) => {
    try {
      const { orderId, itemId } = req.body;
      //console.log(orderId, "Order ID");
      // console.log(itemId, "Item ID");
      const newitemId = itemId.trim();
      const orderData = await order.findById(orderId);
      // console.log(orderData, "Order Data");

      if (!orderData) {
        return res.status(404).json({ message: 'Order not found' });
      }
      let itemToCancel = null; // Change const to let
      orderData.Items.forEach((item, index) => {
        const itemID = item._id.toString();
        if (itemID == newitemId) {
          itemToCancel = item;
        }
      });
      //console.log('Item to Cancel:', itemToCancel);
      if (!itemToCancel) {
        return res.status(404).json({ message: 'Item not found in the order' });
      }
      const product = await productUpload.findById(itemToCancel.productId);
      //console.log(product, "Product Data");

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      product.AvailableQuantity += itemToCancel.quantity;
      itemToCancel.status = 'Cancelled';

      await orderData.save();
      await product.save();
      // Update the success response in the oneItemcancel route
      res.status(200).render('user/orderDetails', { cancelledItem: itemToCancel });


    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  returnOrder: async (req, res) => {
    try {
      const taxRate = 0.01;
      const { orderId, itemId, returnReason, returnDescription } = req.body;
      const newitemId = itemId.trim();
      const orderData = await order.findById(orderId);

      if (!orderData) {
        return res.status(404).json({ message: "order not found" });
      }

      let itemReturn = null;
      let itemIndex = -1;

      orderData.Items.forEach((item, index) => {
        const itemID = item._id.toString();
        if (itemID === newitemId) {
          itemReturn = item;
          itemIndex = index;
        }
      });

      if (!itemReturn || itemIndex === -1) {
        return res.status(404).json({ message: "item not found" });
      }

      orderData.Items[itemIndex].status = "Returned";

      const returnQuantity = itemReturn.quantity;

      await orderData.save();

      const product = await productUpload.findById(itemReturn.productId);

      if (!product) {
        return res.status(404).json({ message: "product not found" });
      }

      const user = await Users.findOne({ email: req.session.email });
      const userId = user._id;

      const productId = product.id;
      const returnDate = new Date();
      const orderDate = orderData.OrderDate;

      const returnData = new Return({
        userId,
        orderId,
        status: "Return",
        product: productId,
        reason: returnReason,
        quantity: returnQuantity,
        returnDate,
        orderDate,
      });

      await returnData.save();

      await Orders.findOneAndUpdate({ _id: orderId }, { Status: "Returned" });
      if (orderData.paymentMethod === "wallet" || orderData.paymentMethod === "online") {
        await Orders.findOneAndUpdate({ _id: orderId }, { paymentStatus: "refunded" });
      }
      let userWallet = await walletmodel.findOne({ userId: userId });

      console.log('User Wallet Before Update:', userWallet);

      if (!userWallet) {
        const newWallet = new walletmodel({
          userId: userId,
          balance: orderData.TotalAmount || 0,
          transactions: [{
            transactionType: 'credit',
            amount: orderData.TotalAmount || 0,
            date: new Date(),
            from: 'product return',
            orderId: orderId,
          }],
        });

        userWallet = await newWallet.save();
        console.log(newWallet, ';;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;llllllllllllllllllllll;;;;;;;;;');
      } else {
        userWallet.balance || 0;
        userWallet.transactions.push({
          transactionType: 'credit',
          amount: orderData.TotalAmount || 0,
          date: new Date(),
          from: 'product return',
          orderId: orderId,
        });
        await userWallet.save();
      }

      console.log('User Wallet After Update:', userWallet);

      return res.status(200).json({ success: true, message: "product return successful" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "internal server error" });
    }
  },

  verifyPayment: async (req, res) => {
    try {
      let hmac = createHmac("sha256", process.env.KEY_SECRET);
      const { payment, orderDetails } = req.body;

      const orderId = orderDetails.createdOrder.receipt;
      const updatedDocument = await order.findByIdAndUpdate(orderId, {
        paymentMethod: "online",
        paymentStatus: "paid",
      });
      res.json({ success: true });
      hmac.update(payment.razorpay_order_id + "|" + payment.razorpay_payment_id);
      hmac = hmac.digest("hex");
      if (hmac === payment.razorpay_signature) {
        const orderId = new mongoose.Types.ObjectId(
          orderDetails.createdOrder.receipt
        );
      } else {
        res.json({ failure: true });
      }
    } catch (error) {
      console.log(error);
    }
  },

  wallet: async (req, res) => {
    const email = req.session.email;
    const userData = await Users.findOne({ email: email });
    req.session.user = userData;

    const userId = userData._id;

    const page = parseInt(req.query.page) || 1;
    const transactionsPerPage = 10;

    try {
      const userWallet = await walletmodel.findOne({ userId: userId });

      if (userWallet) {
        userWallet.transactions.sort((a, b) => b.date - a.date);

        // Calculate the balance based on transactions
        const balance = userWallet.transactions.reduce((total, transaction) => {
          if (transaction.transactionType === 'credit') {
            return total + transaction.amount;
          } else if (transaction.transactionType === 'debit') {
            return total - transaction.amount;
          }
          return total;
        }, 0);
        // Update the wallet balance
        userWallet.balance = balance;

        // Save the updated wallet document
        await userWallet.save();

        const startIndex = (page - 1) * transactionsPerPage;
        const endIndex = startIndex + transactionsPerPage;
        const paginatedTransactions = userWallet.transactions.slice(startIndex, endIndex);

        res.render('user/wallet', {
          wallet: { ...userWallet.toObject(), balance: balance },
          transactions: paginatedTransactions,
          currentPage: page,
          transactionsPerPage: transactionsPerPage,
        });
      } else {
        console.log("Wallet not found for the user");
        res.status(404).send("Wallet not found");
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).send("Internal Server Error");
    }
  },
  addmoneytowallet: async (req, res) => {
    try {
      const email = req.session.email;
      const userData = await Users.findOne({ email: email });
      const userId = userData._id;

      
      const amountInRupees = req.body.amount;
      const amountInPaise = amountInRupees * 100; // Convert rupees to paise

      const accountId = "your_account_id_here";
      const orderOptions = {
        amount: amountInPaise, // Pass the amount in paise to Razorpay
        currency: 'INR',
      };

      rzp.orders.create(orderOptions, async (err, order) => {
        if (err) {
          console.error('Razorpay order creation failed:', err);
          return res.status(500).json({
            success: false,
            message: 'Error creating Razorpay order',
            error: err,
          });
        }

        console.log('Razorpay order created:', order);

        try {
          // Find or create the user's wallet
          let userWallet = await walletmodel.findOne({ userId: userId });
          console.log(userWallet, 'userwalll');
          if (!userWallet) {
            userWallet = new Wallet({ userId: userId, balance: 0, transactions: [] });
          }

          // Update the user's wallet balance
          userWallet.balance += amountInRupees; // Increment balance in rupees
          console.log(userWallet.balance, 'blncece');
          // Create a transaction record for this deposit
          const transaction = {
            transactionType: 'credit',
            amount: amountInRupees,
            from: 'Razorpay', // or wherever the amount is coming from
            orderId: order.id // or wherever you get the order ID from
          };
          userWallet.transactions.push(transaction);

          // Save the updated wallet object
          await userWallet.save();

          console.log(userWallet.balance, 'wallet balance after deposit');

          res.json({
            success: true,
            accountId: accountId,
            amount: order.amount,
            orderId: order.id,
            razorpayOrder: order, // Add this line to send the Razorpay order details
          });
        } catch (error) {
          console.error('Error updating user wallet:', error);
          return res.status(500).json({
            success: false,
            message: 'Error updating user wallet',
            error: error,
          });
        }
      });
    } catch (error) {
      console.error('Error handling add-money request:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error,
      });
    }
  },
  generateInvoices :async (req, res) => {
    try {
      const { orderId } = req.body;
  
      const orderDetails = await order
        .find({ _id: orderId })
        .populate("Items.productId");
  
      const ordersId = orderDetails[0]._id;
  
      if (orderDetails) {
        const invoicePath = await generateInvoice(orderDetails);
        res.json({
          success: true,
          message: "Invoice generated successfully",
          invoicePath,
        });
      } else {
        res
          .status(500)
          .json({ success: false, message: "Failed to generate the invoice" });
      }
    } catch (error) {
      console.error("error in invoice downloading", error);
      res
        .status(500)
        .json({ success: false, message: "Error in generating the invoice" });
    }
  },
   downloadInvoice :async (req, res) => {
    try {
      const id = req.params.orderId;
  
      const filePath = `public/invoices/ivoice-${id}.pdf`;
      console.log("downloaded the pdf invoice");
      res.download(filePath, `invoice.pdf`);
    } catch (error) {
      console.error("Error in downloading the invoice:", error);
      res
        .status(500)
        .json({ success: false, message: "Error in downloading the invoice" });
    }
  },
  reviewsubmit:async (req, res) => {
    try {
      // Extract product ID and comment from the request body
      const { productId, comment, rating, username } = req.body;
      console.log(req.body,'req');
      
      const review = new Review({ productId, comment, rating, username });
      console.log(review,'reviw');
      await review.save();
  
      // Send a success response to the client
      res.json({ success: true });
    } catch (error) {
      console.error('Error submitting review:', error);
      // Send an error response to the client
      res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
  },


}


