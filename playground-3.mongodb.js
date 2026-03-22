

// Select the database to use.
use('MiTiendaDB');

const user = db.getCollection('User').findOne({ email: "admin@demo.com" });


if (!user) {
  print("No se encontró el usuario admin");
} else {
  const userId = user._id;
  const result = db.getCollection('Product').updateMany(
    {}, // todos los productos
    { $set: { userId: userId } }
  );
  return {
    productos_actualizados: result.modifiedCount,
    userId_asignado: userId
  };
}