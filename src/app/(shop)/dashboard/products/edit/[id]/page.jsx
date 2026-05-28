import EditProductForm from "./EditProductForm";

export default async function Page({ params }) {
  const { id } = await params;

  return <EditProductForm productId={id} />;
}