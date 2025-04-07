const express = require('express')
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 3005


//middlewares
app.use(cors())
app.use(express.json())





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { access } = require('fs');

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.it2xzvi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const menuCollection = client.db("BistroBoss").collection("menu");
    const userCollection = client.db("BistroBoss").collection("users");
    const reviewsCollection = client.db("BistroBoss").collection("reveiws");
    const cartCollection = client.db("BistroBoss").collection("carts");

    //get all menu items 
    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray()
      res.send(result)
    })

    //get all reviews 
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray()
      res.send(result)
    })

    //JWT related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });
      res.send({ token });
    })
    

    // middlewares
    const verifyToken = (req, res, next)=> {
      console.log("Inside verify token",req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({message: 'forbidden access'});
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err, decoded)=> {
        if(err){
          return res.status(401).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
      })

    }


    //users related api
    app.get('/users', verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    })


    app.post('/users', async (req, res) => {
      const user = req.body;
      // insert email if doesn't exists:
      // you can do many ways (1. email unique, 2. upsert, 3.simple checking(we are doing the number 3))
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists", insertedId: null })
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })


    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })



    //carts related api 
    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await cartCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/carts', async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem)
      res.send(result)
    })
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(query)
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send("Boss is running....")
})

app.listen(port, () => {
  console.log(`Bistro Boss is Sitting on port ${port} `)
})