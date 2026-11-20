import "./globals.css";

export const metadata = {
  title: "Classifieur AG News",
  description: "Classification automatique d'articles de presse en 4 catégories",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
