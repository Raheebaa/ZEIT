const admin = require("../models/users");
const express = require('express');
const bodyParser = require('body-parser');
const app = express();



const verifyadmin = async (req, res, next) => {
    if (req.session.isAdmin) {

        next();
    } else {
        res.redirect("/admin")
    }
}


const adminExist = async (req, res, next) => {
    if (req.session.isAdmin) {

         res.redirect("/admin/dashboard");
            } else {
        next();
    }
 };

module.exports = { verifyadmin,adminExist }