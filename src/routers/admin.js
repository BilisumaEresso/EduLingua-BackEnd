const express=require("express")

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", isAuth, (req, res, next) => {
  try {
    sendSuccess(res, 200, "user data fetched successfully", { user: req.user });
  } catch (error) {
    next(error);
  }
});


module.exports=router
