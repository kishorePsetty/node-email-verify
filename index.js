require("dotenv").config();
const express = require("express");
const connection = require("./db");
const user = require("./routes/users");

(async () => await connection())();

const app = express();

app.use(express.json());

app.use("/api/user", user);

const port = process.env.PORT || 9090;

app.listen(port, () => console.log("Listening on port", port));