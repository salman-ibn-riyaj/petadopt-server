const express = require('express')
const app = express()
const dotenv = require ('dotenv');
dotenv.config()
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT
app.use(cors())
app.use(express.json())





const uri = process.env.MONGODB_URI;

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
  
    await client.connect();

    const database = client.db("petAdopt");
    const petsCollection = database.collection("pets");

    


   
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
