const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());




app.get("/",(req,res)=>{
    res.send("Khejur BD server is running")
});

app.listen(port, ()=>{
    console.log(`Server listening at port ${port}`);
})
