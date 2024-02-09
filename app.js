const express = require('express');
const flash = require('express-flash');
const userrouter = require('./routes/userrouter');
const adminrouter = require('./routes/adminrouter');
const db = require('./config/dbconfig')

const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
require('dotenv').config()

const path = require('path');
const morgan = require('morgan')
const session = require('express-session')

const nocache = require("nocache")

const multer = require('multer')
const nodemailer = require('nodemailer')
// const mongoDbsession=require('connect-mongodb-session')(session);
const app = express();

const PORT = process.env.PORT || 3000;




app.set('view engine', 'ejs')
//app.use(morgan("tiny"))
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));


app.use(nocache())
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: true
}));

app.use(flash());

app.use('/', userrouter);
app.use('/admin', adminrouter);



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

