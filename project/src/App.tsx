import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { GamesGallery } from './components/GamesGallery';
import { TicTacToe } from './components/TicTacToe';
import { TicTacToeAI } from './components/TicTacToeAI';
import { Checkers } from './components/Checkers';
import { useAuthStore } from './store/authStore';

function App() {
  const { checkAuth, initialized } = useAuthStore();

  useEffect(() => {
    if (!initialized) {
      checkAuth();
    }
  }, [checkAuth, initialized]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/games" element={<GamesGallery />} />
        <Route path="/games/tictactoe" element={<TicTacToe />} />
        <Route path="/games/tictactoe-ai" element={<TicTacToeAI />} />
        <Route path="/games/checkers" element={<Checkers />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;