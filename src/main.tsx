import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import SelectedUserProvider from "./selectedUsersControl.tsx";
import { Tooltip } from "./Tooltip.tsx";

createRoot(document.getElementById("root")!).render(
  <SelectedUserProvider>
    <App />
    <Tooltip />
  </SelectedUserProvider>
);
