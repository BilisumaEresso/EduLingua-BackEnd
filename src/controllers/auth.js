const { User } = require("../models");
const AppError = require("../utils/AppError");
const hashPassword = require("../utils/hashPassword");
const comparePassword=require("../utils/comparePassword")
const sendSuccess = require("../utils/sendSuccess");
const generateToken = require("../utils/generateToken");
const signup = async (req, res, next) => {
  try {
    const { email, username, fullName, nativeLanguage } = req.body;
    const emailExist = await User.findOne({ email: email });
    if (emailExist) {
      throw new AppError("User already exists", 400);
    }
    const userNameExist = await User.findOne({ username: username });
    if (userNameExist) {
      throw new AppError("Username already exists", 400);
    }
    const hashedPassword = await hashPassword(req.body.password);
    let user = new User({
      email,
      username,
      fullName,
      password: hashedPassword,
      nativeLanguage,
    });
    await user.save();
    const token = await generateToken(user);
    user = user.toObject();
    delete user.password;

    sendSuccess(res, 201, "User registered successfully !!", { user, token });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    let user;
    if (email) {
      user = await User.findOne({ email });
    } else if (username) {
      user = await User.findOne({ username });
    }
    if (!user) {
      throw new AppError("Invalid Credintial", 401);
    }
    const isMatch =await comparePassword(password,user.password)
    if(!isMatch){
      throw new AppError("Incorrect Password",400)
    }
    user=user.toObject()
    delete user.password

    const token= await generateToken(user)
    sendSuccess(res,200,"user logged in succefully !!",{user,token})
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req,res,next) => {
  try {
    const updates= req.body
    let user= await User.findById(req.user._id).select("-password")
    if(!user){
      throw new AppError("user not found")
    }

      delete updates.password;
      delete updates.role;
 console.log(updates);
 
     user.set(updates);
    await user.save()
    const token= await generateToken(user)
    sendSuccess(res,200,"user updated successfully !!",{user,token})
  } catch (error) {
    next(error)
  }

};


module.exports = { signup,login,updateUser };
