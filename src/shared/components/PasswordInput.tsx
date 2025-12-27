import { useState } from 'react';
import './PasswordInput.css';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function PasswordInput({ value, onChange, placeholder = "Enter password" }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const getStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '#ddd' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { score: 2, label: 'Fair', color: '#f97316' };
    if (score <= 5) return { score: 3, label: 'Good', color: '#eab308' };
    return { score: 4, label: 'Strong', color: '#22c55e' };
  };

  const strength = getStrength(value);

  return (
    <div className="password-input-container">
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
        🔒 Password (Optional)
      </label>
      <div className="password-input-wrapper">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="password-input-field"
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>

      {value && (
        <div className="password-strength">
          <div className="strength-bar">
            <div
              className="strength-fill"
              style={{
                width: `${(strength.score / 4) * 100}%`,
                backgroundColor: strength.color,
              }}
            />
          </div>
          <span className="strength-label" style={{ color: strength.color }}>
            {strength.label}
          </span>
        </div>
      )}

      <div className="password-hint">
        💡 Password will be used to encrypt the ZIP file. Keep it safe!
      </div>
    </div>
  );
}
