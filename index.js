const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5001;

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

    app.post("/adopt-request", async (req, res) => {
      try {
        const requestData = req.body;

        let petObjectId = requestData.petId;
        if (requestData.petId && ObjectId.isValid(requestData.petId)) {
          petObjectId = new ObjectId(requestData.petId);
        }

        const alreadyRequested = await myRequestCollection.findOne({
          userEmail: requestData.userEmail,
          petId: petObjectId,
        });

        if (alreadyRequested) {
          return res.status(409).send({
            success: false,
            message:
              "You have already submitted an adoption request for this pet! 🐾",
          });
        }

        requestData.petId = petObjectId;
        const result = await myRequestCollection.insertOne(requestData);

        res.status(201).send({
          success: true,
          message: "Adoption request submitted successfully!",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error in POST /adopt-request:", error);
        res.status(500).send({
          success: false,
          message: "Internal Server Error",
        });
      }
    });

    // ========================================================
    // নতুন পেট লিস্ট অ্যাড করার জন্য POST API
    // ========================================================
    app.post("/add-pet", async (req, res) => {
      try {
        const newPet = req.body;

        // সেফটি চেক: নাম, স্পিসিস, ইমেজ এবং ডেসক্রিপশন যেন ফাঁকা না থাকে
        if (!newPet.name || !newPet.species || !newPet.image || !newPet.description) {
          return res.status(400).send({ 
            success: false, 
            message: "Required fields are missing! (Name, Species, Image, and Description) 🐾" 
          });
        }

        // ডাটাবেজের pets কালেকশনে নতুন পেটের ডাটা ইনসার্ট করা
        const result = await petsCollection.insertOne(newPet);
        
        res.status(201).send({
          success: true,
          message: "Pet listed successfully! 🎉",
          insertedId: result.insertedId
        });
      } catch (error) {
        console.error("Error in POST /add-pet:", error);
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
          return res
            .status(400)
            .send({
              success: false,
              message: "Email query parameter is required",
            });
        }
        const result = await myRequestCollection
          .find({ userEmail: email })
          .toArray();

        res.send(result);
      } catch (error) {
        console.error("Error in GET /my-requests:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
      }
    });

    app.delete("/my-requests/:id", async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res
            .status(400)
            .send({ success: false, message: "Invalid request id" });
        }

        const result = await myRequestCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 1) {
          res.send({
            success: true,
            message: "Request cancelled successfully! ",
          });
        } else {
          res
            .status(404)
            .send({ success: false, message: "Request not found" });
        }
      } catch (error) {
        console.error("Error in DELETE /my-requests:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal Server Error" });
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
