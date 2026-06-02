import type { Metadata } from "next";
import "./globals.css";
import { AccessibilityProvider } from "@/components/accessibility-provider";
import { AccessibilityWidget } from "@/components/accessibility-widget";
import { I18nProvider } from "@/components/i18n-provider";

export const metadata: Metadata = {
  title: "HandiTalents",
  description: "Inclusive hiring platform with accessible recruitment flows and account verification.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="app-theme" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <I18nProvider>
          <AccessibilityProvider>
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
