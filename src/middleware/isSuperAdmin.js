const AppError=require("../utils/AppError")
const isSuperAdmin=async (req,res,next)=>{
    try {
      const user = req.user;

      if (user.role !== "super-admin") {
        throw new AppError("Unauthorized",401);
      }
      next();
    } catch (error) {
      next(error);
    }
}

module.exports=isSuperAdmin