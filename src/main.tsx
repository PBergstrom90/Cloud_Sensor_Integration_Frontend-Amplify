import React from "react";
import ReactDOM from "react-dom/client";
import AppWrapper from "./AppWrapper";
import "./index.css";
import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(

  <React.StrictMode>
    <Authenticator>
      <AppWrapper />
    </Authenticator>
  </React.StrictMode>
);