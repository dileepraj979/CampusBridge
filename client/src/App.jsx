import React from 'react';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SyncProvider } from './context/SyncContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import AppShell from './components/shell/AppShell.jsx';

export function App() {
  return (
    <ThemeProvider>
      <SyncProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </SyncProvider>
    </ThemeProvider>
  );
}

export default App;
