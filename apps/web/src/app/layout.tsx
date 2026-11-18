import type { Metadata } from 'next';
import './globals.css';
import { DialogProvider } from '@/components/Dialog';

export const metadata: Metadata = {
  title: 'Database Design & Learning System | Business Analytics',
  description: 'Project-based relational database design, sandbox execution, and gradebook management system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-canvas text-ink antialiased min-h-screen selection:bg-subtle">
        <DialogProvider>
          {children}
        </DialogProvider>
      </body>
    </html>
  );
}
