import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { logger } from '@serenity/core';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Shield,
  Lock,
  Fingerprint,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
  Key,
  Download
} from 'lucide-react';

interface MasterPasswordSetupProps {
  onComplete: (password: string, settings: SecuritySettings) => Promise<void>;
  onBack?: () => void;
}

export interface SecuritySettings {
  enableBiometric: boolean;
  autoLockMinutes: number;
  securityQuestions?: Array<{ question: string; answer: string }>;
  recoveryCodes?: string[];
}

interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  strength: number; // 0-100
}

type SetupStep = 'password' | 'biometric' | 'recovery' | 'complete';

const PREDEFINED_SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "In which city were you born?",
  "What is your mother's maiden name?",
  "What was the name of your elementary school?",
  "What is your favorite book?",
  "What was your childhood nickname?",
  "What is the name of the street you grew up on?",
  "What was your first car's make and model?",
  "What is your favorite movie?",
  "What city did you visit for your first vacation?"
];

export const MasterPasswordSetup: React.FC<MasterPasswordSetupProps> = ({
  onComplete,
  onBack
}) => {
  const [step, setStep] = useState<SetupStep>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    strength: 0
  });

  // Biometric settings
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  // Recovery settings
  const [setupRecovery, setSetupRecovery] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'questions' | 'codes' | null>(null);
  const [securityQuestions, setSecurityQuestions] = useState<Array<{ question: string; answer: string }>>([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check biometric availability
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    if ((window as any).electronAPI?.biometric?.isAvailable) {
      try {
        const result = await (window as any).electronAPI.biometric.isAvailable();
        setBiometricAvailable(result.available);
        setBiometricType(result.type || 'Biometric Authentication');
      } catch (error) {
        logger.error('Failed to check biometric availability:', { component: 'MasterPasswordSetup', operation: 'failedCheckBiometric' }, error as Error);
        setBiometricAvailable(false);
      }
    }
  };

  // Validate password
  const validatePassword = (pwd: string): PasswordValidation => {
    const length = pwd.length >= 12;
    const uppercase = /[A-Z]/.test(pwd);
    const lowercase = /[a-z]/.test(pwd);
    const number = /[0-9]/.test(pwd);
    const special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

    // Calculate strength score (0-100)
    let strength = 0;
    if (length) strength += 20;
    if (uppercase) strength += 20;
    if (lowercase) strength += 20;
    if (number) strength += 20;
    if (special) strength += 20;

    // Bonus for longer passwords
    if (pwd.length >= 16) strength = Math.min(100, strength + 10);
    if (pwd.length >= 20) strength = Math.min(100, strength + 10);

    return { length, uppercase, lowercase, number, special, strength };
  };

  useEffect(() => {
    if (password) {
      setPasswordValidation(validatePassword(password));
    }
  }, [password]);

  const isPasswordValid = () => {
    const v = passwordValidation;
    return v.length && v.uppercase && v.lowercase && v.number && v.special;
  };

  const generateRecoveryCodes = () => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Array.from({ length: 3 }, () => {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
      }).join('-');
      codes.push(code);
    }
    setRecoveryCodes(codes);
  };

  const downloadRecoveryCodes = () => {
    const content = `Serenity Notes Recovery Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${recoveryCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

If you forget your master password, you can use one of these codes to reset it.
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'serenity-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const settings: SecuritySettings = {
        enableBiometric,
        autoLockMinutes: 15,
        securityQuestions: recoveryMethod === 'questions' ? securityQuestions : undefined,
        recoveryCodes: recoveryMethod === 'codes' ? recoveryCodes : undefined
      };

      await onComplete(password, settings);
    } catch (error) {
      logger.error('Failed to complete setup:', { component: 'MasterPasswordSetup', operation: 'failedCompleteSetup:' }, error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password Strength Meter Component
  const PasswordStrengthMeter: React.FC<{ strength: number }> = ({ strength }) => {
    const getColor = () => {
      if (strength < 40) return 'bg-red-500';
      if (strength < 60) return 'bg-orange-500';
      if (strength < 80) return 'bg-yellow-500';
      return 'bg-green-500';
    };

    const getLabel = () => {
      if (strength < 40) return 'Weak';
      if (strength < 60) return 'Fair';
      if (strength < 80) return 'Good';
      return 'Strong';
    };

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Password Strength
          </span>
          <span className={`text-sm font-semibold ${
            strength < 40 ? 'text-red-600 dark:text-red-400' :
            strength < 60 ? 'text-orange-600 dark:text-orange-400' :
            strength < 80 ? 'text-yellow-600 dark:text-yellow-400' :
            'text-green-600 dark:text-green-400'
          }`}>
            {getLabel()}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColor()} transition-all duration-300`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>
    );
  };

  // Requirements Checklist Component
  const RequirementsChecklist: React.FC<{ validation: PasswordValidation }> = ({ validation }) => {
    const Requirement: React.FC<{ met: boolean; text: string }> = ({ met, text }) => (
      <div className="flex items-center gap-2 text-sm">
        {met ? (
          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-400 dark:text-gray-600" />
        )}
        <span className={met ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}>
          {text}
        </span>
      </div>
    );

    return (
      <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password Requirements:
        </p>
        <Requirement met={validation.length} text="At least 12 characters" />
        <Requirement met={validation.uppercase} text="One uppercase letter (A-Z)" />
        <Requirement met={validation.lowercase} text="One lowercase letter (a-z)" />
        <Requirement met={validation.number} text="One number (0-9)" />
        <Requirement met={validation.special} text="One special character (!@#$...)" />
      </div>
    );
  };

  // Step 1: Password Creation
  const renderPasswordStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create Your Master Password
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This password will encrypt all your data. Choose something strong and memorable.
        </p>
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Master Password
        </label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a strong password"
            className="pr-10"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Password Strength Meter */}
      {password && <PasswordStrengthMeter strength={passwordValidation.strength} />}

      {/* Requirements Checklist */}
      {password && <RequirementsChecklist validation={passwordValidation} />}

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            Passwords do not match
          </p>
        )}
        {confirmPassword && password === confirmPassword && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Passwords match
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        {onBack && (
          <Button variant="secondary" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
        <Button
          onClick={() => setStep('biometric')}
          disabled={!isPasswordValid() || password !== confirmPassword}
          className="flex-1 flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // Step 2: Biometric Setup
  const renderBiometricStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Enable Biometric Authentication
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Use {biometricType} for quick and secure access
        </p>
      </div>

      {biometricAvailable ? (
        <div className="space-y-4">
          <button
            onClick={() => setEnableBiometric(!enableBiometric)}
            className={`w-full p-6 rounded-xl border-2 transition-all ${
              enableBiometric
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                enableBiometric
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}>
                <Fingerprint className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {biometricType}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Unlock with fingerprint or face recognition
                </p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                enableBiometric
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {enableBiometric && <CheckCircle className="w-5 h-5 text-white" />}
              </div>
            </div>
          </button>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Your master password is securely stored</p>
                <p>
                  When enabled, your password will be encrypted and stored in your system's keychain,
                  accessible only via biometric authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                Biometric authentication not available
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your device doesn't support biometric authentication. You can enable it later
                in Settings if your device supports it.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        <Button variant="secondary" onClick={() => setStep('password')} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={() => setStep('recovery')} className="flex-1 flex items-center justify-center gap-2">
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // Step 3: Recovery Setup
  const renderRecoveryStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Set Up Account Recovery
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose a method to recover your account if you forget your master password
        </p>
      </div>

      {!setupRecovery ? (
        <div className="space-y-4">
          {/* Recovery Codes Option */}
          <button
            onClick={() => {
              setSetupRecovery(true);
              setRecoveryMethod('codes');
              generateRecoveryCodes();
            }}
            className="w-full p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Recovery Codes (Recommended)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Download 10 backup codes to restore access
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          {/* Security Questions Option */}
          <button
            onClick={() => {
              setSetupRecovery(true);
              setRecoveryMethod('questions');
            }}
            className="w-full p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Security Questions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Answer questions to recover your account
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          {/* Skip Option */}
          <div className="text-center pt-4">
            <button
              onClick={() => setStep('complete')}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Skip for now (not recommended)
            </button>
          </div>
        </div>
      ) : recoveryMethod === 'codes' ? (
        // Recovery Codes Display
        <div className="space-y-4">
          <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700/50">
            <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Your Recovery Codes
            </h3>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {recoveryCodes.map((code, i) => (
                <div key={i} className="p-2 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
                  {i + 1}. {code}
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={downloadRecoveryCodes}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Recovery Codes
          </Button>

          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700/50">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <p className="font-medium mb-1">Important</p>
                <p>
                  Store these codes in a safe place. Each code can only be used once.
                  Without these codes or your master password, you won't be able to access your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Security Questions Form
        <div className="space-y-4">
          {securityQuestions.map((q, index) => (
            <div key={index} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Question {index + 1}
              </label>
              <select
                value={q.question}
                onChange={(e) => {
                  const newQuestions = [...securityQuestions];
                  newQuestions[index].question = e.target.value;
                  setSecurityQuestions(newQuestions);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Select a question...</option>
                {PREDEFINED_SECURITY_QUESTIONS.map((question) => (
                  <option key={question} value={question}>{question}</option>
                ))}
              </select>
              <Input
                type="text"
                value={q.answer}
                onChange={(e) => {
                  const newQuestions = [...securityQuestions];
                  newQuestions[index].answer = e.target.value;
                  setSecurityQuestions(newQuestions);
                }}
                placeholder="Your answer"
              />
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        <Button
          variant="secondary"
          onClick={() => {
            if (setupRecovery) {
              setSetupRecovery(false);
              setRecoveryMethod(null);
            } else {
              setStep('biometric');
            }
          }}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={() => setStep('complete')}
          disabled={
            setupRecovery &&
            ((recoveryMethod === 'questions' && securityQuestions.some(q => !q.question || !q.answer)) ||
             (recoveryMethod === 'codes' && recoveryCodes.length === 0))
          }
          className="flex-1 flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  // Step 4: Complete
  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-green-100 dark:bg-green-900/30 rounded-full">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          You're All Set!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your master password has been configured securely
        </p>
      </div>

      {/* Summary */}
      <div className="space-y-3 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          Setup Summary
        </h3>
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300">Master password created</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {enableBiometric ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
          <span className="text-gray-700 dark:text-gray-300">
            Biometric authentication {enableBiometric ? 'enabled' : 'not enabled'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {recoveryMethod ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
          <span className="text-gray-700 dark:text-gray-300">
            Recovery method {recoveryMethod ? 'configured' : 'not configured'}
          </span>
        </div>
      </div>

      {/* Warning if no recovery */}
      {!recoveryMethod && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800 dark:text-orange-200">
              <p className="font-medium mb-1">No recovery method configured</p>
              <p>
                If you forget your master password, you will permanently lose access to all your data.
                You can set up recovery options later in Settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Complete Button */}
      <Button
        onClick={handleComplete}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Setting up...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Complete Setup
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/30 p-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {['password', 'biometric', 'recovery', 'complete'].map((s, i) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full mx-1 transition-colors ${
                    (['password', 'biometric', 'recovery', 'complete'].indexOf(step) >= i)
                      ? 'bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Step {['password', 'biometric', 'recovery', 'complete'].indexOf(step) + 1} of 4
            </p>
          </div>

          {/* Step Content */}
          {step === 'password' && renderPasswordStep()}
          {step === 'biometric' && renderBiometricStep()}
          {step === 'recovery' && renderRecoveryStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
};
