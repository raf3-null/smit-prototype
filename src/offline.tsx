import React from "react";
import { createRoot } from "react-dom/client";
import Operations from "./components/operations";
import { Provider } from "./components/store";
createRoot(document.getElementById("root")!).render(
  <Provider>
    <Operations />
  </Provider>,
);
