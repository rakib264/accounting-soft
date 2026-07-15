"use client";

import { createContext, useContext, useState } from "react";

type SidebarContextValue = {
  expanded: boolean;
  setExpanded: (value: boolean) => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <SidebarContext.Provider
      value={{
        expanded,
        setExpanded,
        toggle: () => setExpanded((value) => !value),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
