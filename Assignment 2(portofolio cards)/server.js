import express from "express";
import cors from "cors";
import morgan from "morgan";
import * as RouteHandler from "./utilities/RouteHandler.js";

const app = express();

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  }),
);

// let nextId = 4;

// Routes
app.get("/", RouteHandler.HomeRoute);

app.get("/api/cards", RouteHandler.getApiCards);

app.get("/api/cards/:id", RouteHandler.getCardsThroughId);

app.post("/api/cards", RouteHandler.postCards);

app.use(RouteHandler.Error);

app.listen(3000, () => console.log("server is listening"));
