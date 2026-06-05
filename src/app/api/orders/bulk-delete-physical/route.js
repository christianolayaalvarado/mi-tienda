// app/api/orders/bulk-delete-physical/route.js  (usar con extremo cuidado)
export async function DELETE(req) {
  // validar admin...
  const { orderIds = [] } = await req.json();
  const result = await prisma.$transaction(async (tx) => {
    await tx.orderHistory.deleteMany({ where: { orderId: { in: orderIds } } });
    await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
    // si tienes orderItemProducts como colección separada, borrarlos también
    const del = await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    return del;
  });
  return NextResponse.json({ success: true, deletedCount: result.count || result });
}
