const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

let isConnected = false;
async function connectDB() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  return client.db("petAdopt");
}

async function validateToken(req, res, next) {
  const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_SIDE_URL}/api/auth/jwks`));
  const authHeaders = req?.headers.authorization;
  if (!authHeaders) return res.status(401).json({ message: "unauthorized" });
  const token = authHeaders?.split(" ")[1];
  try {
    await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
}

app.get("/", (req, res) => res.send("Hello Salman!"));

app.get("/featured", async (req, res) => {
  const db = await connectDB();
  const result = await db.collection("pets").find().limit(6).toArray();
  res.send(result);
});

app.get("/all-pets", async (req, res) => {
  try {
    const db = await connectDB();
    const { search, species, sort } = req.query;
    let query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (species && species !== "All") query.species = species;
    let sortOption = {};
    if (sort === "low-to-high") sortOption.adoptionFee = 1;
    else if (sort === "high-to-low") sortOption.adoptionFee = -1;
    const result = await db.collection("pets").find(query).sort(sortOption).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

app.get("/all-pets/:id", validateToken, async (req, res) => {
  const db = await connectDB();
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid pet id" });
  const result = await db.collection("pets").findOne({ _id: new ObjectId(id) });
  if (!result) return res.status(404).json({ message: "Pet not found" });
  res.send(result);
});

app.post("/adopt-request", async (req, res) => {
  try {
    const db = await connectDB();
    const requestData = req.body;
    let petObjectId = requestData.petId;
    if (requestData.petId && ObjectId.isValid(requestData.petId)) petObjectId = new ObjectId(requestData.petId);
    const alreadyRequested = await db.collection("myRequests").findOne({ userEmail: requestData.userEmail, petId: petObjectId });
    if (alreadyRequested) return res.status(409).send({ success: false, message: "You have already submitted an adoption request for this pet!" });
    requestData.petId = petObjectId;
    const result = await db.collection("myRequests").insertOne(requestData);
    res.status(201).send({ success: true, message: "Adoption request submitted successfully!", insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

app.post("/add-pet", validateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const newPet = req.body;
    if (!newPet.name || !newPet.species || !newPet.image || !newPet.description)
      return res.status(400).send({ success: false, message: "Required fields are missing!" });
    const result = await db.collection("pets").insertOne(newPet);
    res.status(201).send({ success: true, message: "Pet listed successfully!", insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

app.get("/my-requests", async (req, res) => {
  try {
    const db = await connectDB();
    const { email } = req.query;
    if (!email) return res.status(400).send({ success: false, message: "Email query parameter is required" });
    const result = await db.collection("myRequests").find({ userEmail: email }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

app.get("/my-listings", async (req, res) => {
  try {
    const db = await connectDB();
    const { email } = req.query;
    if (!email) return res.status(400).send({ success: false, message: "Email query parameter is required" });
    const result = await db.collection("pets").find({ ownerEmail: email }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

app.delete("/my-requests/:id", validateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ success: false, message: "Invalid request id" });
    const result = await db.collection("myRequests").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) res.send({ success: true, message: "Request cancelled successfully!" });
    else res.status(404).send({ success: false, message: "Request not found" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

app.delete("/add-pet/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).send({ success: false, message: "Invalid pet id" });
    const result = await db.collection("pets").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) res.send({ success: true, message: "Pet listing deleted successfully!" });
    else res.status(404).send({ success: false, message: "Pet listing not found" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

app.put("/add-pet/:id", validateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const { id } = req.params;
    const updatedPet = req.body;
    if (!ObjectId.isValid(id)) return res.status(400).send({ success: false, message: "Invalid pet id" });
    const result = await db.collection("pets").updateOne(
      { _id: new ObjectId(id) },
      { $set: { name: updatedPet.name, species: updatedPet.species, breed: updatedPet.breed, age: updatedPet.age, gender: updatedPet.gender, vaccinationStatus: updatedPet.vaccinationStatus, image: updatedPet.image, healthStatus: updatedPet.healthStatus, location: updatedPet.location, adoptionFee: Number(updatedPet.adoptionFee) || 0, description: updatedPet.description } }
    );
    if (result.matchedCount === 1) res.send({ success: true, message: "Pet information updated successfully!" });
    else res.status(404).send({ success: false, message: "Pet listing not found" });
  } catch (error) {
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

module.exports = app;