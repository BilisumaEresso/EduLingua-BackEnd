const {User}=require("../models")
const AppError=require("../utils/AppError")
const sendSuccess=require("../utils/sendSuccess")
const signup = async (req, res, next) => {
  try {
    const {email,username,fullName,password,nativeLanguage}=req.body
    const emailExist= await User.findOne({email:email})
    if(emailExist){
      throw new AppError("User already exists",400)
    }
    const userNameExist=await User.findOne({username:username})
    if(userNameExist){
      throw new AppError("Username already exists",400)
    }
    const user=new User({
      email,username,fullName,password,nativeLanguage
    })

    await user.save()

    sendSuccess(res,201,"User registered successfully !!",{user})
  } catch (err) {
    next(err);
  }
};
