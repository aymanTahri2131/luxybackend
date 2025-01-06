import jwt from "jsonwebtoken";

//user authentication middleware

const authUser = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.json({
        success: false,
        message: "Not Authorized Login Again",
      });
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = token_decode.id;

    next();
  } catch (error) {

    if (error.name === "TokenExpiredError") {
      res.status(401).json({ success: false, message: "Token expired" });
    } else {
      res.status(401).json({ success: false, message: error.message });
    }
  }
};

export default authUser;
