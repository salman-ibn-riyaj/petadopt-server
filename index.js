const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT;
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("petAdopt");
    const petsCollection = database.collection("pets");
    const myRequestCollection = database.collection("myRequests");

    

    app.get("/featured", async (req, res) => {
      const result = await petsCollection.find().limit(6).toArray();
      res.send(result);
    });
    app.get("/all-pets", async (req, res) => {
      const result = await petsCollection.find().toArray();
      res.send(result);
    });

    app.get("/all-pets/:id", async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid pet id" });
      }

      const result = await petsCollection.findOne({ _id: new ObjectId(id) });
      if (!result) return res.status(404).json({ message: "Pet not found" });
      res.send(result);
    });

    // ৩. POST API: নতুন অ্যাডোপশন রিকোয়েস্ট ডাটাবেজে সেভ করার জন্য
    app.post("/adopt-request", async (req, res) => {
      try {
        const requestData = req.body;

        // ফ্রন্টএন্ড থেকে পাঠানো petId-কে ডাটাবেজে ObjectId-তে কনভার্ট করার সেফটি চেক
        if (requestData.petId && ObjectId.isValid(requestData.petId)) {
          requestData.petId = new ObjectId(requestData.petId);
        }

        
        const result = await myRequestCollection.insertOne(requestData);
        
        res.status(201).send({
          success: true,
          message: "Adoption request submitted successfully!",
          insertedId: result.insertedId
        });
      } catch (error) {
        console.error("Error in POST /adopt-request:", error);
        res.status(500).send({ 
          success: false, 
          message: "Internal Server Error" 
        });
      }
    });

    
    app.get("/my-requests", async (req, res) => {
      try {
        const { email } = req.query;
        if (!email) {
          return res.status(400).send({ success: false, message: "Email query parameter is required" });
        }
        const result = await myRequestCollection.find({ userEmail: email }).toArray();
        
        res.send(result);
      } catch (error) {
        console.error("Error in GET /my-requests:", error);
        res.status(500).send({ success: false, message: "Internal Server Error" });
      }
    });

    
    app.delete("/my-requests/:id", async (req, res) => {
      try {
        const { id } = req.params;

     
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ success: false, message: "Invalid request id" });
        }

        
        const result = await myRequestCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
          res.send({ success: true, message: "Request cancelled successfully! " });
        } else {
          res.status(404).send({ success: false, message: "Request not found" });
        }
      } catch (error) {
        console.error("Error in DELETE /my-requests:", error);
        res.status(500).send({ success: false, message: "Internal Server Error" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
