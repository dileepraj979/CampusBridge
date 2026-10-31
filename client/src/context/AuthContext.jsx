import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setAccessToken } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState('PRINCIPAL');
  const [permissions, setPermissions] = useState([]);
  const [scope, setScope] = useState({ collegeId: null, departmentId: null, classId: null });
  const [isLoading, setIsLoading] = useState(true);
  const [demoAccounts, setDemoAccounts] = useState([]);

  // Fetch demo accounts for switcher bar
  useEffect(() => {
    async function fetchDemos() {
      try {
        const res = await api.getDemoAccounts();
        if (res.success && res.data) {
          setDemoAccounts(res.data);
        }
      } catch (err) {
        console.error('Failed to load demo accounts', err);
      }
    }
    fetchDemos();
  }, []);

  // Initialize current user
  useEffect(() => {
    async function initAuth() {
      try {
        const res = await api.getMe();
        if (res.success && res.data) {
          setUser(res.data);
          setActiveRole(res.data.activeRole);
          setPermissions(res.data.permissions || []);
          setScope(res.data.scope || {});
          setIsLoading(false);
          return;
        }
      } catch (err) {
        // Not logged in yet - auto login as Principal for instant rich demo experience
        try {
          const loginRes = await api.login({
            email: 'principal@ait.edu',
            password: 'password123',
            deviceName: 'Academic Workstation'
          });
          if (loginRes.success && loginRes.data) {
            setAccessToken(loginRes.data.accessToken);
            setUser(loginRes.data.user);
            setActiveRole(loginRes.data.user.activeRole);
            setPermissions(loginRes.data.user.permissions || []);
          }
        } catch (loginErr) {
          console.warn('Auto-login demo fallback error:', loginErr.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  // Switch Active Role for current user
  const switchRole = async (targetRole) => {
    try {
      const res = await api.switchRole(targetRole);
      if (res.success) {
        setAccessToken(res.data.accessToken);
        setActiveRole(targetRole);
        setPermissions(res.data.permissions || []);
        setScope(res.data.scope || {});
        setUser(prev => ({
          ...prev,
          activeRole: targetRole
        }));
      }
    } catch (err) {
      console.error('Failed to switch role', err);
      // Optimistically update if role is assigned
      setActiveRole(targetRole);
    }
  };

  // Quick switch demo user (login as a different account)
  const quickSwitchUser = async (targetEmail) => {
    setIsLoading(true);
    try {
      const res = await api.login({
        email: targetEmail,
        password: 'password123',
        deviceName: 'Demo Switcher'
      });
      if (res.success && res.data) {
        setAccessToken(res.data.accessToken);
        setUser(loginUser => res.data.user);
        setActiveRole(res.data.user.activeRole);
        setPermissions(res.data.user.permissions || []);
        const activeAssignment = res.data.user.roles.find(r => r.role === res.data.user.activeRole);
        setScope({
          collegeId: activeAssignment?.collegeId?._id || activeAssignment?.collegeId || null,
          departmentId: activeAssignment?.departmentId || null,
          classId: activeAssignment?.classId || null
        });
      }
    } catch (err) {
      console.error('Quick switch failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        permissions,
        scope,
        isLoading,
        demoAccounts,
        switchRole,
        quickSwitchUser,
        logout,
        hasPermission: (perm) => permissions.includes('*') || permissions.includes(perm)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
