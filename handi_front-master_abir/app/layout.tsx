import type { Metadata } from "next";
import { IBM_Plex_Sans, Manrope } from "next/font/google";
import "./globals.css";
import { AccessibilityProvider } from "@/components/accessibility-provider";
import { AccessibilityWidget } from "@/components/accessibility-widget";
import { I18nProvider } from "@/components/i18n-provider";

// Configure Manrope font for headings
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Configure IBM Plex Sans font for body text
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HandiTalents",
  description: "Inclusive hiring platform with accessible recruitment flows and account verification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`app-theme ${manrope.variable} ${ibmPlexSans.variable}`} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <I18nProvider>
          <AccessibilityProvider>
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
            <AccessibilityWidget />
          </AccessibilityProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
