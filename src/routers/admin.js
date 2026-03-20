const express=require("express");
const isSuperAdmin = require("../middleware/isSuperAdmin");

const router = express.Router();

// super Admin
router.put("/promote", signup);
router.put("/demote", login);
router.get("/shut-system", isAuth,isSuperAdmin, (req, res, next) => {
  try {
    sendSuccess(res, 200, "not implemented yet");
  } catch (error) {
    next(error);
  }
});


module.exports=router
