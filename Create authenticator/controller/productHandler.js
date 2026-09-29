export const ProductsMiddleWare = (req, res, next) => {
  console.log("HELLO THIS PRODUCT MIDDLEWARE HAS RAN");
  next();
};

export const handleProducts = (req, res) => {
  console.log("This is the cookies", req.cookies);
  const userToken = req.cookies.authtoken;

  const userData = Buffer.from(userToken, "base64").toString("utf-8");
  console.log("Hi from paaran paaran path");
  const userObj = JSON.parse(userData);
  res.json(userObj);
};
