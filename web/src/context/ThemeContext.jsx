// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Theme is now permanently light mode
  const isDark = false;
  const toggle = () => console.warn("Theme toggle is disabled. The app is in Light Mode only.");

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
