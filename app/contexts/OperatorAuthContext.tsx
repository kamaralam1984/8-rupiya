'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Operator {
  id: string;
  name: string;
  phone: string;
  email: string;
  operatorCode: string;
}

interface OperatorAuthContextType {
  operator: Operator | null;
  token: string | null;
  login: (token: string, operator: Operator) => void;
  logout: () => void;
  updateOperator: (operator: Operator) => void;
  isAuthenticated: boolean;
}

const OperatorAuthContext = createContext<OperatorAuthContextType | undefined>(undefined);

export function OperatorAuthProvider({ children }: { children: ReactNode }) {
  const [operator, setOperator] = useState<Operator | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load operator and token from localStorage on mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('operator_token');
      const storedOperator = localStorage.getItem('operator');
      
      if (storedToken && storedOperator) {
        try {
          setToken(storedToken);
          setOperator(JSON.parse(storedOperator));
        } catch (error) {
          console.error('Error parsing stored operator:', error);
          localStorage.removeItem('operator_token');
          localStorage.removeItem('operator');
        }
      }
    }
  }, []);

  const login = (newToken: string, newOperator: Operator) => {
    setToken(newToken);
    setOperator(newOperator);
    if (typeof window !== 'undefined') {
      localStorage.setItem('operator_token', newToken);
      localStorage.setItem('operator', JSON.stringify(newOperator));
    }
  };

  const logout = () => {
    setToken(null);
    setOperator(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('operator_token');
      localStorage.removeItem('operator');
    }
  };

  const updateOperator = (updatedOperator: Operator) => {
    setOperator(updatedOperator);
    if (typeof window !== 'undefined') {
      localStorage.setItem('operator', JSON.stringify(updatedOperator));
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <OperatorAuthContext.Provider
      value={{
        operator,
        token,
        login,
        logout,
        updateOperator,
        isAuthenticated: !!operator && !!token,
      }}
    >
      {children}
    </OperatorAuthContext.Provider>
  );
}

export function useOperatorAuth() {
  const context = useContext(OperatorAuthContext);
  if (context === undefined) {
    throw new Error('useOperatorAuth must be used within an OperatorAuthProvider');
  }
  return context;
}

