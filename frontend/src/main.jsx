// ===== frontend/src/main.jsx =====
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://46e4b30c1ecedc2c288709ab3d4b0b86@o4510357666594816.ingest.us.sentry.io/4510357668429824",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <Sentry.withProfiler>
    <App />
  </Sentry.withProfiler>
)