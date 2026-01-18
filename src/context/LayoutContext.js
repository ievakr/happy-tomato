import React from "react";

const LayoutContext = React.createContext({
    showSidebar: false,
    setShowSidebar: () => {}
});

export default LayoutContext;
