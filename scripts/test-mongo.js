// scripts/test-mongo.js
import 'dotenv/config'; // carga .env automáticamente
import clientPromise from "../src/lib/mongodb.js";

async function run() {
  const client = await clientPromise;
  const db = client.db(); // o client.db("MiTiendaDB")
  const stats = await db.stats();
  console.log("Conexión OK. DB:", db.databaseName, "Collections:", stats.collections);
  await client.close();
}
run().catch(err => { console.error("Error conexión:", err); process.exit(1); });
