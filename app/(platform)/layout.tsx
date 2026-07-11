import { redirect } from "next/navigation";
import { AppShell } from "@/src/components/AppShell";
import { getSessionUser } from "@/src/lib/auth";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
