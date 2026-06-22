import { redirect } from "next/navigation";

// The dashboard now lives at the app root; keep this path working.
export default function DashboardRedirect() {
  redirect("/");
}
