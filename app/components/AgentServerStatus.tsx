'use client';

import { useEffect, useState } from 'react';

export default function AgentServerStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [message, setMessage] = useState('Checking...');

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('/api/agent/server-status');
        const data = await response.json();
        
        if (data.success) {
          setStatus(data.connected ? 'connected' : 'disconnected');
          setMessage(data.message || (data.connected ? 'Server Start' : 'Server Not Connect'));
        } else {
          setStatus('disconnected');
          setMessage('Server Not Connect');
        }
      } catch (error) {
        setStatus('disconnected');
        setMessage('Server Not Connect');
      }
    };

    // Check immediately
    checkServerStatus();

    // Check every 10 seconds
    const interval = setInterval(checkServerStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {status === 'checking' && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Checking...</span>
        </div>
      )}
      {status === 'connected' && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-white">{message}</span>
        </div>
      )}
      {status === 'disconnected' && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm font-medium text-red-300">{message}</span>
        </div>
      )}
    </div>
  );
}

