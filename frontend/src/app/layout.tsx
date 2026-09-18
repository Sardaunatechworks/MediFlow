import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { PrescriptionProvider } from '@/context/PrescriptionContext';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'MediFlow | Clinical Prioritization & Pharmacy Availability Network',
  description:
    'Intelligent healthcare coordination platform: Patient Registration, ESI Clinical Triage, Live Acuity Queue, Clinician Consultation, and Verified Pharmacy Medicine Availability.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ToastProvider>
            <PrescriptionProvider>
              <AppShell>{children}</AppShell>
            </PrescriptionProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
