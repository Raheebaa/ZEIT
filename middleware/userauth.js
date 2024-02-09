const user=require('../models/users')



const verifyuser = async (req, res, next) => {
    
    if (req.session.user) {
        next();
    } else {
        res.redirect("/");
    }
};


const userExist = async (req, res, next) => {
    if (req.session.user) {

        res.redirect('/home')
    } else {
        next();
    }
};

module.exports={userExist,verifyuser}