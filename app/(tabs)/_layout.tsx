import React from 'react';

// Transparent layout: render children directly so this folder doesn't create a tab navigator.
export default function TransparentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
