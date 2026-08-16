import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Sidebar } from "@/components/Sidebar";
import { DemoBadge } from "@/components/DemoBadge";

export const metadata: Metadata = {
  title: "YouTube Watch-Time Accelerator",
  description:
    "A legitimate creator-growth command center — reach 4,000 valid public watch hours through real audience discovery, retention and returning viewers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-ink antialiased">
        <StoreProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden">
              <DemoBadge />
              <div className="mx-auto max-w-[1400px] px-6 py-8">{children}</div>
            </main>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
