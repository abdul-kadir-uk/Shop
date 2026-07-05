import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
