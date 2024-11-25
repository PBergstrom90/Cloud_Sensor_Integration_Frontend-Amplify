import React from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import App from "./App";

// Create a dark theme
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
      default: "#121212", // Default background
      paper: "#1e1e1e", // Card backgrounds
    },
    text: {
      primary: "#ffffff", // Primary text color
      secondary: "#b0b0b0", // Secondary text color
    },
  },
});

const AppWrapper: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline /> {/* Applies global baseline styles */}
      <App />
    </ThemeProvider>
  );
};

export default AppWrapper;
