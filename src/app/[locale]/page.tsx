// In your page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";
import LoginPageClient from "@/components/LoginPageClient";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/en/dashboard");
  }

  return <LoginPageClient />;
}