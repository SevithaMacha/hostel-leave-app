// Demonstrates basic MongoDB database and collection commands.
require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in backend/.env");
  }

  console.log("=== MongoDB Basic Commands Demo ===");
  console.log(`Connecting to: ${uri}`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const collectionName = "demo_students";
  const collection = db.collection(collectionName);

  console.log(`\n1) Current Database Name:\n   ${db.databaseName}`);

  const existingCollections = await db.listCollections().toArray();
  console.log("\n2) Collections Before Demo:");
  if (existingCollections.length === 0) {
    console.log("   (no collections found)");
  } else {
    existingCollections.forEach((c) => console.log(`   - ${c.name}`));
  }

  await collection.deleteMany({});
  console.log(`\n3) Cleared Existing Records in '${collectionName}'`);

  const insertResult = await collection.insertMany([
    { name: "Asha", branch: "CSE", year: 2 },
    { name: "Rahul", branch: "ECE", year: 3 },
    { name: "Meena", branch: "IT", year: 1 }
  ]);
  console.log(`\n4) Inserted Documents Count:\n   ${insertResult.insertedCount}`);

  const allDocs = await collection.find({}).toArray();
  console.log("\n5) Read All Documents:");
  allDocs.forEach((doc) => {
    console.log(`   - ${doc.name}, ${doc.branch}, Year ${doc.year} (id: ${doc._id})`);
  });

  const updateResult = await collection.updateOne(
    { name: "Rahul" },
    { $set: { year: 4 } }
  );
  console.log(`\n6) Update One (Rahul -> year 4):\n   matched=${updateResult.matchedCount}, modified=${updateResult.modifiedCount}`);

  const updatedDoc = await collection.findOne({ name: "Rahul" });
  console.log(`   Updated Record: ${updatedDoc.name}, ${updatedDoc.branch}, Year ${updatedDoc.year}`);

  const deleteResult = await collection.deleteOne({ name: "Meena" });
  console.log(`\n7) Delete One (Meena):\n   deleted=${deleteResult.deletedCount}`);

  const remainingDocs = await collection.find({}).toArray();
  console.log("\n8) Remaining Documents:");
  remainingDocs.forEach((doc) => {
    console.log(`   - ${doc.name}, ${doc.branch}, Year ${doc.year}`);
  });

  const collectionsAfter = await db.listCollections().toArray();
  console.log("\n9) Collections After Demo:");
  collectionsAfter.forEach((c) => console.log(`   - ${c.name}`));

  await db.dropCollection(collectionName);
  console.log(`\n10) Dropped Collection:\n   ${collectionName}`);

  await mongoose.disconnect();
  console.log("\n=== Demo Completed Successfully ===");
}

run().catch(async (error) => {
  console.error("\nDemo Failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    // noop
  }
  process.exit(1);
});
