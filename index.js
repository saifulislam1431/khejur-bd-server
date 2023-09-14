const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@khejurbd.2z99p4m.mongodb.net/?retryWrites=true&w=majority`;

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: "Unauthorized Access" })
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: "Unauthorized Access" })
        }
        req.decoded = decoded;
        next()
    })
}







// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const allProductCollection = client.db("KhejurDB").collection("products");
        const cartCollection = client.db("KhejurDB").collection("cart");
        const usersCollection = client.db("KhejurDB").collection("users");
        const reviewsCollection = client.db("KhejurDB").collection("reviews");
        const districtsCollection = client.db("KhejurDB").collection("districts");
        const ordersCollection = client.db("KhejurDB").collection("orders");

        // JWT
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "4h" })
            res.send({ token })
        })





        // All products
        app.get('/all-products', async (req, res) => {
            const result = await allProductCollection.find({}).toArray();
            res.send(result)
        })

        // Cart Api
        app.post("/product-cart", verifyJWT, async (req, res) => {
            const newData = req.body;
            const result = await cartCollection.insertOne(newData);
            res.send(result);
        })

        app.get("/users-carts", verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const result = await cartCollection.find({ email: email }).toArray();
                return res.send(result)
            } else {
                return res.status(401).send({ error: true, message: "Unauthorized Access" })
            }
        })



        // users api
        app.post("/users", async (req, res) => {
            const newUser = req.body;
            const email = { email: newUser.email };
            const existUser = await usersCollection.findOne(email);
            if (existUser) {
                return res.json("User Exist!")
            } else {
                const result = await usersCollection.insertOne(newUser);
                return res.send(result);
            }
        })

        app.get("/user", verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            if (query) {
                const result = await usersCollection.findOne(query);
                res.send(result)
            }
        })

        app.patch("/update-user-info/:id", async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = { _id: new ObjectId(id) };
            const user = await usersCollection.findOne(filter);
            if (user?.state && user?.city && user?.address && user?.postalCode) {
                return res.json("Already Added")
            } else {
                const addressInfo = {
                    $set: {
                        address: data.address,
                        state: data.state,
                        city: data.city,
                        postalCode: data.postalCode,
                        addressType: data.addressType
                    }

                }
                const result = await usersCollection.updateOne(filter, addressInfo)
                res.send(result)
            }
        })




        // Review
        app.get("/reviews", async (req, res) => {
            const result = await reviewsCollection.find({}).toArray();
            res.send(result)
        })

        app.post("/write-review", verifyJWT, async (req, res) => {
            const newReview = req.body;
            const result = await reviewsCollection.insertOne(newReview);
            res.send(result);
        })


        app.get("/all-districts", async (req, res) => {
            const result = await districtsCollection.find({}).toArray();
            res.send(result)
        })


        // Orders
        app.post("/confirm-orders", verifyJWT, async(req,res)=>{
            const email = req.query.email;
            const newOrder = req.body;
            if(email && newOrder){
                const result = await ordersCollection.insertOne(newOrder);
                if(result){
                    const query = {email: email};
                    const dltResult = await cartCollection.deleteMany(query)
                    res.send(dltResult)
                }
            }
        })





        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Server successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);







app.get("/", (req, res) => {
    res.send("Khejur BD server is running")
});

app.listen(port, () => {
    console.log(`Server listening at port ${port}`);
})
