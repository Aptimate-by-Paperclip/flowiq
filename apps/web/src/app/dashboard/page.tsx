import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ margin: 0 }}>FlowIQ Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <OrganizationSwitcher />
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <p>Welcome to FlowIQ. Your documents and workflows will appear here.</p>
    </main>
  );
}
