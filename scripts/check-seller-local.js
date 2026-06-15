import 'dotenv/config';
import clientPromise from "../src/lib/mongodb.js";

async function run() {
  const sellerId = "69c366414d10cb2207e7b402";
  const client = await clientPromise;
  const db = client.db();
  console.log("DB usada por client.db():", db.databaseName);
  const docs = await db.collection("payment_methods").find({
    $or: [{ storeId: sellerId }, { store_id: sellerId }, { userId: sellerId }, { sellerId: sellerId }]
  }).toArray();
  console.log("Encontrados:", docs.length);
  console.log(JSON.stringify(docs, null, 2));
  await client.close();
}
run().catch(e => { console.error(e); process.exit(1); });
