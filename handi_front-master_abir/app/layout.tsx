import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AccessibilityProvider } from "@/components/accessibility-provider";
import { AccessibilityWidget } from "@/components/accessibility-widget";
import { DocumentTitle } from "@/components/document-title";
import { I18nProvider } from "@/components/i18n-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Accueil - HandiTalents",
    template: "%s - HandiTalents",
  },
  description: "Plateforme de recrutement inclusif avec parcours accessibles et vérification des comptes.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${inter.variable} app-theme`} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <I18nProvider>
          <AccessibilityProvider>
            <DocumentTitle />
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
            <AccessibilityWidget />
            {modal}
          </AccessibilityProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
