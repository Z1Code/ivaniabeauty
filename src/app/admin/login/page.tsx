import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/firebase/auth-helpers";
import LoginClient from "./LoginClient";

export default async function AdminLoginPage() {
  const admin = await getAdminSession();

  // Redirect only when the session is actually valid (not just cookie present).
  if (admin) {
    redirect("/admin");
  }

  return <LoginClient />;
}
