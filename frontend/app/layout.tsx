import "./globals.css";
import Providers from "@/providers";

export const metadata = {
  title: "Aliauf Store",
  description: "Groceries & Mobile Repair",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
