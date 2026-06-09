import { createRoot } from "react-dom/client";
import { Sentry, initSentry } from "./lib/sentry";
import App from "./App";
import "./index.css";

initSentry();

const FallbackUI = () => (
  <div style={{ padding: 24, fontFamily: "system-ui" }}>
    <h1>Something went wrong</h1>
    <p>The error has been reported. Please refresh the page.</p>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<FallbackUI />} showDialog={false}>
    <App />
  </Sentry.ErrorBoundary>
);
