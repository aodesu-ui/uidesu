import React from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-slot="layout"
    >
      <main>{children}</main>
    </div>
  )
}
