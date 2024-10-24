import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/common/Header";
import { WalletSelectorContextProvider } from "@/context/WalletSelectorContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chain Sleuth",
  description: "Blockchain investigation tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletSelectorContextProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto p-4">
              {children}
            </main>
            <footer className="bg-gray-200 p-4">
              <div className="container mx-auto text-center">
                © 2023 Chain Sleuth
              </div>
            </footer>
          </div>
        </WalletSelectorContextProvider>
      </body>
    </html>
  );
}
