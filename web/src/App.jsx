import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TimerProvider } from "./context/TimerContext";
import Landing from "./pages/Landing";
import { Toaster } from "react-hot-toast";

// Lazy load heavy components to speed up initial paint
const Login = React.lazy(() => import("./pages/Login"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Tasks = React.lazy(() => import("./pages/Tasks"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const Layout = React.lazy(() => import("./layouts/Layout"));
const ColorTest = React.lazy(() => import("./pages/ColorTest"));

// Shared loading state
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-dvh bg-white">
    <div className="spinner mb-4 border-primary-600" />
    <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Initializing TANZI</span>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-dvh bg-white p-6 text-center">
          <h1 className="text-2xl font-black text-slate-800 mb-4 italic uppercase">CRITICAL SYSTEM ERROR</h1>
          <p className="text-primary-600 text-sm mb-8 font-mono max-w-lg break-words">{this.state.error?.message || "Unknown error"}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 rounded-2xl bg-primary-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-primary-600/20"
          >
            RESTART APP
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" />;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/app" replace /> : <Landing />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <TaskProvider>
            <TimerProvider>
              <React.Suspense fallback={<LoadingScreen />}>
                <HashRouter>
                  <Toaster position="top-right" toastOptions={{
                    style: { background: '#ffffff', color: '#18181b', border: '1px solid #e2e8f0', borderRadius: '1rem', fontWeight: '700' }
                  }} />
                  <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/color-test" element={<ColorTest />} />
                    <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                      <Route index element={<Dashboard />} />
                      <Route path="tasks" element={<Tasks />} />
                      <Route path="analytics" element={<Analytics />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </HashRouter>
              </React.Suspense>
            </TimerProvider>
          </TaskProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
