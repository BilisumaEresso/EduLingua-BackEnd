const isSuperAdmin=async (req,res,next)=>{
    try {
      const user = req.user;
      if (!user === "super-admin") {
        throw new AppError("Unauthorized");
      }
      next();
    } catch (error) {
      next(error);
    }
}

module.exports=isSuperAdmin