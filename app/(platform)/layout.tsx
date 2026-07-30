import { redirect } from "next/navigation";
import { AppShell } from "@/src/components/AppShell";
import { getSessionUser } from "@/src/lib/auth";
import { DEFAULT_ENABLED_MODULES, type ModuleId } from "@/src/lib/modules";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      user={{
        name: user.name,
        companyName: user.companyName,
        enabledModules: (user.enabledModules?.length
          ? user.enabledModules
          : DEFAULT_ENABLED_MODULES) as ModuleId[],
        role: user.role ?? "viewer",
      }}
    >
      {children}
    </AppShell>
  );
}
