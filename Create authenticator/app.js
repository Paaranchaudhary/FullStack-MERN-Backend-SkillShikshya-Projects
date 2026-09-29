import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import * as ProductHandler from "./controller/productHandler.js";
import UserRouter from "./route/UserRoute.js";
import SignUpRouter from "./route/loginRoute.js";
import AuthRouter from "./route/authRoute.js";
import authenticateUser from "./middleware/authMiddleware.js";

const app = express();

app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

dotenv.config();
console.log(process.env.PORT);

app.use(cookieParser("my-secret"));

app.use("/signup", SignUpRouter);
app.use("/users", UserRouter);
app.use("/auth", AuthRouter);

app.get(
  "/product",
  authenticateUser,
  ProductHandler.ProductsMiddleWare,
  ProductHandler.handleProducts,
);

app.all("/*splat", (req, res) => {
  console.log("Hi this is catch all");
  res.status(404).send("nor found");
});

app.listen(process.env.PORT, () =>
  console.log(`server is running on port ${process.env.PORT}`),
);
