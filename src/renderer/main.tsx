import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n"; // Initialize i18n
import "./index.css";

// Initialize accessibility testing in development mode
if (process.env.NODE_ENV !== "production") {
  import("@axe-core/react").then((axe) => {
    axe.default(React, ReactDOM, 1000, {
      rules: [
        {
          id: "color-contrast",
          enabled: true,
        },
        {
          id: "label",
          enabled: true,
        },
        {
          id: "button-name",
          enabled: true,
        },
      ],
    });
  });
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
