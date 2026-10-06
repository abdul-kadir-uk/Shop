// app/layout.tsx
import "./globals.css";
import Providers from "@/providers";

export const metadata = {
  title: "Aliauf.com",
  description: "Groceries & Brand New Mobiles at the lowest prices",
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
