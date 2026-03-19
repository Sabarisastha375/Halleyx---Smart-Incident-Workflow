import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authApi.register({ name, email, password });
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-600/20 blur-[120px] mix-blend-screen animate-blob"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-emerald-600/20 blur-[120px] mix-blend-screen animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="w-full max-w-md card relative z-10 m-4 animate-slide-up">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white tracking-wide">Create Account</h2>
          <p className="text-sm text-slate-400 mt-2">Join Smart Incident Workflow</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input 
              type="text" 
              className="input" 
              placeholder="John Doe" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input 
              type="email" 
              className="input" 
              placeholder="you@company.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input 
              type="password" 
              className="input" 
              placeholder="••••••••" 
              minLength={6}
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
