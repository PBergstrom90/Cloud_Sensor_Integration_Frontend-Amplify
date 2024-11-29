import React from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#0077b6", // Ocean blue for primary actions
    },
    secondary: {
      main: "#f48fb1", // Pink for secondary actions
    },
    background: {
      default: "linear-gradient(180deg, rgb(15, 5, 37), rgb(3, 3, 5))", // Gradient for main background
      paper: "#1e1e1e", // Card backgrounds
    },
    text: {
      primary: "#ffffff", // Primary text color
      secondary: "#b0b0b0", // Secondary text color
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "linear-gradient(180deg, rgb(15, 5, 37), rgb(3, 3, 5))",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        },
      },
    },
  },
});

const AppWrapper: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline /> {/* Applies global baseline styles */}
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default AppWrapper;