import "./globals.css";

export const metadata = {
  title: "TSP Tactical Dashboard",
  description: "Explore the TSP tactical allocation strategy and historical results.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
