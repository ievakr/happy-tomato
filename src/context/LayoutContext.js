import React, { useContext } from "react";

const LayoutContext = React.createContext({
    showSidebar: false,
    setShowSidebar: () => {}
});

export function useLayoutContext() {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error("useLayoutContext must be used within a LayoutProvider");
  }
  return ctx;
}

export default LayoutContext;
