const jwt= require("jsonwebtoken")
const dotenv=require("dotenv")
const jwtKey=process.env.JWT_KEY

const generateToken= (user)=>{

    const payload = {
      userId: user._id,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    };

     const signOptions = {
       algorithm: "HS256", // More secure than HS256
       issuer: "my-api-auth", // Who created the token
       audience: "my-app-ui", // Who is the token for
     };

    return jwt.sign(payload,jwtKey,signOptions)
}

module.exports=generateToken