'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn } from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError('Invalid password');
        setPassword('');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo size={76} priority />
          </div>
          <h1 className="text-2xl font-serif font-bold text-earth-dark">Admin Portal</h1>
          <p className="text-earth-mid text-sm mt-1">Island to Infinity</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-sand shadow-sm p-6 space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-earth-mid mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-light" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-4 py-2.5 border border-sand rounded-xl text-sm text-earth-dark placeholder:text-earth-light focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-terracotta to-terracotta-dark text-white py-2.5 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-earth-light mt-6">
          Contact your project administrator for access.
        </p>
      </div>
    </div>
  );
}