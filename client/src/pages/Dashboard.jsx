import { useState, useEffect } from 'react';
import { getHealth } from '../services/authService';

export default function Dashboard() {
  const [status, setStatus] = useState('checking...');

  useEffect(() => {
    getHealth()
      .then(() => setStatus('connected'))
      .catch(() => setStatus('disconnected'));
  }, []);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="text-center">
        <p className="text-h1 font-display text-ink">Dashboard</p>
        <p className="text-body text-ink/60 mt-2">
          Server status: <span className="font-medium">{status}</span>
        </p>
      </div>
    </div>
  );
}
