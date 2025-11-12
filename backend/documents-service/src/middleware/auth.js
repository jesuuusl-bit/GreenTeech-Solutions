// This middleware reconstructs req.user from custom headers forwarded by the API Gateway
exports.reconstructUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (userId && userRole) {
    req.user = {
      id: userId,
      role: userRole
    };
  }
  next();
};
