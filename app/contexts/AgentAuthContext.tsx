'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  agentCode: string;
  agentPanelText?: string;
  agentPanelTextColor?: 'red' | 'green' | 'blue' | 'black';
  totalShops: number;
  totalEarnings: number;
}

interface AgentAuthContextType {
  agent: Agent | null;
  token: string | null;
  login: (token: string, agent: Agent) => void;
  logout: () => void;
  updateAgent: (agent: Agent) => void;
  isAuthenticated: boolean;
}

const AgentAuthContext = createContext<AgentAuthContextType | undefined>(undefined);

export function AgentAuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load agent and token from localStorage on mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('agent_token');
      const storedAgent = localStorage.getItem('agent');
      
      if (storedToken && storedAgent) {
        try {
          setToken(storedToken);
          setAgent(JSON.parse(storedAgent));
        } catch (error) {
          console.error('Error parsing stored agent:', error);
          localStorage.removeItem('agent_token');
          localStorage.removeItem('agent');
        }
      }
    }
  }, []);

  const login = (newToken: string, newAgent: Agent) => {
    setToken(newToken);
    setAgent(newAgent);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agent_token', newToken);
      localStorage.setItem('agent', JSON.stringify(newAgent));
    }
  };

  const logout = () => {
    setToken(null);
    setAgent(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agent_token');
      localStorage.removeItem('agent');
    }
  };

  const updateAgent = (updatedAgent: Agent) => {
    setAgent(updatedAgent);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agent', JSON.stringify(updatedAgent));
    }
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <AgentAuthContext.Provider
      value={{
        agent,
        token,
        login,
        logout,
        updateAgent,
        isAuthenticated: !!agent && !!token,
      }}
    >
      {children}
    </AgentAuthContext.Provider>
  );
}

export function useAgentAuth() {
  const context = useContext(AgentAuthContext);
  if (context === undefined) {
    throw new Error('useAgentAuth must be used within an AgentAuthProvider');
  }
  return context;
}


