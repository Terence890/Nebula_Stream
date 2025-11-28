import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { Toaster } from 'sonner';
import Auth from './pages/Auth';
import Profiles from './pages/Profiles';
import Browse from './pages/Browse';
import ListPage from './pages/ListPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="text-red-600 text-xl">Loading...</div>
      </div>
    );
  }

  return token ? children : <Navigate to="/auth" />;
};

function AppContent() {
  const { token } = useAuth();

  return (
    <>
      <Toaster position="top-right" theme="dark" />
      <Routes>
        <Route path="/auth" element={token ? <Navigate to="/profiles" /> : <Auth />} />
        <Route
          path="/profiles"
          element={
            <ProtectedRoute>
              <Profiles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/browse"
          element={
            <ProtectedRoute>
              <Browse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/list/:category"
          element={
            <ProtectedRoute>
              <ListPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={token ? "/browse" : "/auth"} />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <AppContent />
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
