const express = require('express')
const router = express.Router();
const fs = require('fs');
const Order = require("../models/orderModel");
const productUpload = require('../models/productSchema')
const moment = require("moment");
const pdf = require('../util/pdfGenerator')
const { format } = require('date-fns');
const getOrdersAndSellers = async (req, res) => {
  try {
    const bestSeller = await Order.aggregate([
      {
        $unwind: "$Items",
      },
      {
        $group: {
          _id: "$Items.productId",
          totalCount: { $sum: "$Items.quantity" },
        },
      },
      {
        $sort: { totalCount: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "productuploads",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
    ]);
    if (!bestSeller) {
      throw new Error("no data found");
    } else {
      //   console.log(bestSeller);
      res.json({ bestSeller });
    }
  } catch (err) {
    console.log(err);
  }
};

const salesReport = async (req, res) => {
  try {
    const orders = await Order.aggregate([
      {
        $match: {
          status: {
            $nin: ["returned", "Cancelled", "Rejected"],
          },
        },
      },
    ]);
    const orderCountsByDay = {};
    const totalAmountByDay = {};
    const orderCountsByMonth = {};
    const totalAmountByMonth = {};
    const orderCountsByYear = {};
    const totalAmountByYear = {};
    let labelsByCount;
    let labelsByAmount;

    orders.forEach((order) => {
      // console.log(order)
      const orderDate = moment(order.OrderDate, "M/D/YYYY, h:mm:ss A");
      const dayMonthYear = orderDate.format("YYYY-MM-DD");
      const monthYear = orderDate.format("YYYY-MM");
      const year = orderDate.format("YYYY");
      // console.log(orderDate,"...",dayMonthYear,"...",monthYear,"...",year);


      if (req.url === "/count-orders-by-day") {
        if (!orderCountsByDay[dayMonthYear]) {
          orderCountsByDay[dayMonthYear] = 1;
          totalAmountByDay[dayMonthYear] = order.TotalPrice;
        } else {
          orderCountsByDay[dayMonthYear]++;
          totalAmountByDay[dayMonthYear] = order.TotalPrice;
        }

        const ordersByDay = Object.keys(orderCountsByDay).map(
          (dayMonthYear) => ({
            _id: dayMonthYear,
            count: orderCountsByDay[dayMonthYear],
          })
        );
        const amountsByDay = Object.keys(totalAmountByDay).map(
          (dayMonthYear) => ({
            _id: dayMonthYear,
            total: totalAmountByDay[dayMonthYear],
          })
        );
        amountsByDay.sort((a, b) => (a._id < b._id ? -1 : 1));
        ordersByDay.sort((a, b) => (a._id < b._id ? -1 : 1));

        labelsByCount = ordersByDay.map((entry) =>
          moment(entry._id, "YYYY-MM-DD").format("DD MMM YYYY")
        );

        labelsByAmount = amountsByDay.map((entry) =>
          moment(entry._id, "YYYY-MM-DD").format("DD MMM YYYY")
        );

        dataByCount = ordersByDay.map((entry) => entry.count);
        dataByAmount = amountsByDay.map((entry) => entry.total);
      } else if (req.url === "/count-orders-by-month") {
        if (!orderCountsByMonth[monthYear]) {
          orderCountsByMonth[monthYear] = 1;
          totalAmountByMonth[monthYear] = order.TotalPrice;
        } else {
          orderCountsByMonth[monthYear]++;
          totalAmountByMonth[monthYear] += order.TotalPrice;
        }

        const ordersByMonth = Object.keys(orderCountsByMonth).map(
          (monthYear) => ({
            _id: monthYear,
            count: orderCountsByMonth[monthYear],
          })
        );
        const amountsByMonth = Object.keys(totalAmountByMonth).map(
          (monthYear) => ({
            _id: monthYear,
            total: totalAmountByMonth[monthYear],
          })
        );

        ordersByMonth.sort((a, b) => (a._id < b._id ? -1 : 1));
        amountsByMonth.sort((a, b) => (a._id < b._id ? -1 : 1));

        labelsByCount = ordersByMonth.map((entry) =>
          moment(entry._id, "YYYY-MM").format("MMM YYYY")
        );
        labelsByAmount = amountsByMonth.map((entry) =>
          moment(entry._id, "YYYY-MM").format("MMM YYYY")
        );
        dataByCount = ordersByMonth.map((entry) => entry.count);
        dataByAmount = amountsByMonth.map((entry) => entry.total);
      } else if (req.url === "/count-orders-by-year") {
        // Count orders by year
        if (!orderCountsByYear[year]) {
          orderCountsByYear[year] = 1;
          totalAmountByYear[year] = order.TotalPrice;
        } else {
          orderCountsByYear[year]++;
          totalAmountByYear[year] += order.TotalPrice;
        }

        const ordersByYear = Object.keys(orderCountsByYear).map((year) => ({
          _id: year,
          count: orderCountsByYear[year],
        }));
        const amountsByYear = Object.keys(totalAmountByYear).map((year) => ({
          _id: year,
          total: totalAmountByYear[year],
        }));

        ordersByYear.sort((a, b) => (a._id < b._id ? -1 : 1));
        amountsByYear.sort((a, b) => (a._id < b._id ? -1 : 1));

        labelsByCount = ordersByYear.map((entry) => entry._id);
        labelsByAmount = amountsByYear.map((entry) => entry._id);
        dataByCount = ordersByYear.map((entry) => entry.count);
        dataByAmount = amountsByYear.map((entry) => entry.total);
      }
    });
    res.json({ labelsByCount, labelsByAmount, dataByCount, dataByAmount });
  } catch (err) {
    console.log(err);
  }
};

const generateSalesReport = async (req, res) => {
  try {
    // Extract parameters from request body
    let startDate = new Date(req.body.startDate);
    const format = req.body.downloadFormat;
    let endDate = new Date(req.body.endDate);
    endDate.setHours(23, 59, 59, 999); // Set end time to end of the day

    // Log date range for debugging
    console.log('Start Date:', startDate);
    console.log('End Date:', endDate);

    // MongoDB aggregation query
    const orders = await Order.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["paid", "pending"] },
          OrderDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $lookup: {
          from: 'productuploads',
          localField: 'Items.productId',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $unwind: '$productDetails',
      },
    ]);

    // Log retrieved orders for debugging
    console.log('Orders:', orders);

    // Calculate total sales
    let totalSales = 0;
    orders.forEach((order) => {
      totalSales += order.TotalPrice || 0;
    });

    // Format dates
    startDate = moment(startDate).format("YYYY-MM-DD");
    endDate = moment(endDate).format("YYYY-MM-DD");

    // Pass data to PDF generation function
    pdf.download(
      req,
      res,
      orders,
      startDate,
      endDate,
      totalSales.toFixed(2),
      format
    );

  } catch (error) {
    console.log('Error generating sales report:', error);
    res.status(500).send("Internal server error");
  }
};



const customSalesReport = async (req, res) => {
  try {
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    const orders = await Order.aggregate([
      {
        $match: {
          status: {
            $nin: ["returned", "Cancelled", "Rejected"],
          },
        },
      },
      {
        $match: {
          OrderDate: {
            $gte: startDate,
            $lte: endDate,
          }
        }
      }
    ]);
    const orderCountsByDay = {};
    const totalAmountByDay = {};
    let labelsByCount;
    let labelsByAmount;

    orders.forEach((order) => {

      const orderDate = moment(order.OrderDate, "M/D/YYYY, h:mm:ss A");
      const dayMonthYear = orderDate.format("YYYY-MM-DD");

      if (!orderCountsByDay[dayMonthYear]) {
        orderCountsByDay[dayMonthYear] = 1;
        totalAmountByDay[dayMonthYear] = order.TotalPrice;
      } else {
        orderCountsByDay[dayMonthYear]++;
        totalAmountByDay[dayMonthYear] = order.TotalPrice;
      }

      const ordersByDay = Object.keys(orderCountsByDay).map(
        (dayMonthYear) => ({
          _id: dayMonthYear,
          count: orderCountsByDay[dayMonthYear],
        })
      );
      const amountsByDay = Object.keys(totalAmountByDay).map(
        (dayMonthYear) => ({
          _id: dayMonthYear,
          total: totalAmountByDay[dayMonthYear],
        })
      );
      amountsByDay.sort((a, b) => (a._id < b._id ? -1 : 1));
      ordersByDay.sort((a, b) => (a._id < b._id ? -1 : 1));

      labelsByCount = ordersByDay.map((entry) =>
        moment(entry._id, "YYYY-MM-DD").format("DD MMM YYYY")
      );

      labelsByAmount = amountsByDay.map((entry) =>
        moment(entry._id, "YYYY-MM-DD").format("DD MMM YYYY")
      );

      dataByCount = ordersByDay.map((entry) => entry.count);
      dataByAmount = amountsByDay.map((entry) => entry.total);



    })

    res.json({ labelsByCount, labelsByAmount, dataByCount, dataByAmount });
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  getOrdersAndSellers,
  salesReport,
  generateSalesReport,
  customSalesReport,
};
