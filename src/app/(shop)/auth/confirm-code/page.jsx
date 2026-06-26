import { Suspense } from "react";
import ConfirmCodeClient from "./ConfirmCodeClient";

export default function Page() {
  return (
    <Suspense>
      <ConfirmCodeClient />
    </Suspense>
  );
}
