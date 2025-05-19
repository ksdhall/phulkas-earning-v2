// src/app/page.tsx
import { redirect } from 'next/navigation';

// This is a Server Component that redirects based on locale negotiation or default
export default function RootPage() {
  // You could add logic here to detect user's preferred locale (e.g., from headers)
  // For simplicity, we'll just redirect to the default locale /en
  redirect('/en');
}