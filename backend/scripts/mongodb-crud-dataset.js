// CRUD operations on a given dataset using MongoDB.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in backend/.env");
  }

  const datasetPath = path.join(__dirname, "../datasets/inventory-dataset.json");
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
  const collectionName = "inventory_records";

  console.log("=== MongoDB CRUD Operations on Dataset ===");
  console.log(`Connecting to: ${uri}`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const collection = db.collection(collectionName);

  console.log(`\nDataset file loaded: ${datasetPath}`);
  console.log(`Documents in dataset: ${dataset.length}`);

  // CREATE
  await collection.deleteMany({});
  const createResult = await collection.insertMany(dataset);
  console.log(`\n1) CREATE`);
  console.log(`   Inserted documents: ${createResult.insertedCount}`);

  // READ
  const allDocs = await collection.find({}).toArray();
  const stationeryDocs = await collection.find({ category: "Stationery" }).toArray();
  console.log(`\n2) READ`);
  console.log(`   Total documents after insert: ${allDocs.length}`);
  console.log(`   Stationery documents: ${stationeryDocs.length}`);
  console.log("   Sample listing:");
  allDocs.forEach((doc) => {
    console.log(`   - ${doc.itemCode} | ${doc.name} | Rs.${doc.price} | Qty:${doc.quantity}`);
  });

  // UPDATE
  const updateOneResult = await collection.updateOne(
    { itemCode: "ITM-104" },
    { $set: { price: 699, supplier: "BrightHome Plus" } }
  );

  const updateManyResult = await collection.updateMany(
    { category: "Stationery" },
    { $inc: { quantity: 20 } }
  );

  console.log(`\n3) UPDATE`);
  console.log(`   updateOne matched=${updateOneResult.matchedCount}, modified=${updateOneResult.modifiedCount}`);
  console.log(`   updateMany matched=${updateManyResult.matchedCount}, modified=${updateManyResult.modifiedCount}`);

  // DELETE
  const deleteOneResult = await collection.deleteOne({ itemCode: "ITM-105" });
  const deleteManyResult = await collection.deleteMany({ quantity: { $lt: 40 } });

  console.log(`\n4) DELETE`);
  console.log(`   deleteOne removed=${deleteOneResult.deletedCount}`);
  console.log(`   deleteMany removed=${deleteManyResult.deletedCount}`);

  // FINAL READ
  const finalDocs = await collection.find({}).sort({ itemCode: 1 }).toArray();
  console.log(`\n5) FINAL STATE`);
  console.log(`   Remaining documents: ${finalDocs.length}`);
  finalDocs.forEach((doc) => {
    console.log(`   - ${doc.itemCode} | ${doc.name} | Rs.${doc.price} | Qty:${doc.quantity} | ${doc.supplier}`);
  });

  await mongoose.disconnect();
  console.log("\n=== CRUD Demo Completed Successfully ===");
}

run().catch(async (error) => {
  console.error("\nCRUD Demo Failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    // noop
  }
  process.exit(1);
});
