import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MistralHub - Multi-Modal AI Assistant",
  description: "A powerful chat application powered by Mistral AI with vision, document analysis, and streaming capabilities.",
  keywords: ["Mistral AI", "Chat", "AI Assistant", "Vision", "Document AI", "LLM"],
  authors: [{ name: "Mistral AI Intern Candidate" }],
  openGraph: {
    title: "MistralHub - Multi-Modal AI Assistant",
    description: "Experience the power of Mistral AI with real-time chat, image analysis, and document understanding.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <div className="animated-gradient min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
