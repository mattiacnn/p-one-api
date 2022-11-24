const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const app = express();

// MIDDLEWARES
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

dotenv.config();

// connect to db
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true }, () => 
    console.log("connected to db")
);

// ROUTES
const authRoute = require("./routes/auth");
const challengeRoute = require("./routes/challenge");
const userRoute = require("./routes/user");
const participantRoute = require("./routes/participant");
const chatRoute = require("./routes/chat");

// ROUTES MIDDLEWARES
app.use("/api/auth", authRoute);
app.use("/api/challenge", challengeRoute);
app.use("/api/user", userRoute);
app.use("/api/participant", participantRoute);
app.use("/api/chat", chatRoute);

const port = process.env.PORT || "3000";

app.listen(port, () => console.log(`servers is running ${port}`));
