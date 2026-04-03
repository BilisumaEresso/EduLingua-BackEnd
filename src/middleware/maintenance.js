const systemState = require("../utils/systemState");

const checkMaintenance = (req, res, next) => {
  if (systemState.isShutdown) {
    // Whitelist critical paths so Super-Admins can re-enter & unlock the system
    const bypassPaths = [
      "/api/v1/admin/shut-system", // To unlock
      "/api/v1/auth/login",        // To authenticate
      "/api/v1/auth/me"            // To identify session
    ];
    
    const isBypass = bypassPaths.some(p => req.originalUrl.includes(p));

    if (!isBypass) {
      // 503 triggers the frontend interceptor to drop the global app layout
      return res.status(503).json({
        success: false,
        message: "System is under maintenance. Please come back later.",
        code: "MAINTENANCE_MODE"
      });
    }
  }
  next();
};

module.exports = checkMaintenance;
