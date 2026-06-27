import MascotGallery from "@/components/MascotGallery";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata = {
  title: "Mis Mascotas | Dashboard",
};

export default function MascotasPage() {
  return (
    <div className="p-4 md:p-10">
      <Breadcrumbs />
      <MascotGallery />
    </div>
  );
}
