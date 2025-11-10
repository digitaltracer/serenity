import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Shield, Key, CheckCircle, AlertCircle, ArrowLeft, Lock } from 'lucide-react';

interface PasswordResetFlowProps {
  onComplete: (newPassword: string) => void;
  onCancel: () => void;
  recoveryCodes?: string[];
  securityQuestions?: Array<{ question: string; answer: string }>;
}

type ResetMethod = 'choose' | 'recovery-code' | 'security-questions';
type ResetStep = 'method' | 'verify' | 'new-password' | 'complete';

interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  strength: number;
}

export const PasswordResetFlow: React.FC<PasswordResetFlowProps> = ({
  onComplete,
  onCancel,
  recoveryCodes = [],
  securityQuestions = []
}) => {
  const [step, setStep] = useState<ResetStep>('method');
  const [method, setMethod] = useState<ResetMethod>('choose');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Recovery code state
  const [enteredCode, setEnteredCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);

  // Security questions state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [questionsVerified, setQuestionsVerified] = useState(false);

  // New password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const hasRecoveryCodes = recoveryCodes.length > 0;
  const hasSecurityQuestions = securityQuestions.length >= 3;
  const hasAnyRecoveryMethod = hasRecoveryCodes || hasSecurityQuestions;

  // Password validation
  const validatePassword = (pwd: string): PasswordValidation => {
    const length = pwd.length >= 12;
    const uppercase = /[A-Z]/.test(pwd);
    const lowercase = /[a-z]/.test(pwd);
    const number = /[0-9]/.test(pwd);
    const special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

    let strength = 0;
    if (length) strength += 20;
    if (uppercase) strength += 20;
    if (lowercase) strength += 20;
    if (number) strength += 20;
    if (special) strength += 20;

    if (pwd.length >= 16) strength = Math.min(100, strength + 10);
    if (pwd.length >= 20) strength = Math.min(100, strength + 10);

    return { length, uppercase, lowercase, number, special, strength };
  };

  const validation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canProceedToNewPassword = codeVerified || questionsVerified;
  const canCompleteReset =
    validation.length &&
    validation.uppercase &&
    validation.lowercase &&
    validation.number &&
    validation.special &&
    passwordsMatch;

  // Verify recovery code
  const handleVerifyCode = () => {
    setError('');
    const normalizedCode = enteredCode.trim().toUpperCase();

    if (recoveryCodes.includes(normalizedCode)) {
      setCodeVerified(true);
      setSuccess('Recovery code verified successfully!');
      setTimeout(() => {
        setStep('new-password');
        setSuccess('');
      }, 1000);
    } else {
      setError('Invalid recovery code. Please try again.');
      setEnteredCode('');
    }
  };

  // Verify security question answer
  const handleVerifyAnswer = () => {
    setError('');
    const currentQuestion = securityQuestions[currentQuestionIndex];
    const userAnswer = answers[currentQuestionIndex].trim().toLowerCase();
    const correctAnswer = currentQuestion.answer.trim().toLowerCase();

    if (userAnswer === correctAnswer) {
      if (currentQuestionIndex < 2) {
        // Move to next question
        setSuccess('Correct! Moving to next question...');
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSuccess('');
        }, 800);
      } else {
        // All questions answered correctly
        setQuestionsVerified(true);
        setSuccess('All security questions verified!');
        setTimeout(() => {
          setStep('new-password');
          setSuccess('');
        }, 1000);
      }
    } else {
      setError('Incorrect answer. Please try again.');
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = '';
      setAnswers(newAnswers);
    }
  };

  // Complete password reset
  const handleCompleteReset = () => {
    if (canCompleteReset) {
      onComplete(newPassword);
    }
  };

  // Method selection screen
  const renderMethodSelection = () => {
    if (!hasAnyRecoveryMethod) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Recovery Method Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You did not set up any recovery methods when creating your master password.
            Unfortunately, your password cannot be recovered.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            You will need to reset the application and start fresh, which will erase all encrypted data.
          </p>
          <Button onClick={onCancel} variant="secondary">
            Back to Login
          </Button>
        </div>
      );
    }

    return (
      <div>
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Reset Master Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a recovery method to reset your password
          </p>
        </div>

        <div className="space-y-4">
          {hasRecoveryCodes && (
            <button
              onClick={() => {
                setMethod('recovery-code');
                setStep('verify');
              }}
              className="w-full p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
            >
              <div className="flex items-start gap-4">
                <Key className="w-6 h-6 text-blue-500 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Use Recovery Code
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter one of your saved recovery codes to reset your password
                  </p>
                </div>
              </div>
            </button>
          )}

          {hasSecurityQuestions && (
            <button
              onClick={() => {
                setMethod('security-questions');
                setStep('verify');
              }}
              className="w-full p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
            >
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-green-500 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Answer Security Questions
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Answer your security questions to verify your identity
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>

        <div className="mt-6">
          <Button onClick={onCancel} variant="secondary" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    );
  };

  // Recovery code verification screen
  const renderRecoveryCodeVerification = () => {
    return (
      <div>
        <div className="text-center mb-8">
          <Key className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Enter Recovery Code
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Enter one of your saved recovery codes
          </p>
        </div>

        <div className="mb-6">
          <Input
            type="text"
            placeholder="XXXX-XXXX-XXXX"
            value={enteredCode}
            onChange={(e) => {
              setEnteredCode(e.target.value);
              setError('');
            }}
            className="text-center text-lg tracking-wider uppercase font-mono"
            autoFocus
          />
          {error && (
            <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> Recovery codes are single-use only. After using a code,
            it will no longer be valid.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleVerifyCode}
            className="w-full"
            disabled={enteredCode.trim().length < 10}
          >
            Verify Code
          </Button>
          <Button
            onClick={() => {
              setStep('method');
              setError('');
              setEnteredCode('');
            }}
            variant="secondary"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Choose Different Method
          </Button>
        </div>
      </div>
    );
  };

  // Security questions verification screen
  const renderSecurityQuestions = () => {
    const currentQuestion = securityQuestions[currentQuestionIndex];

    return (
      <div>
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Security Question {currentQuestionIndex + 1} of 3
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Answer all three questions to verify your identity
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {currentQuestion.question}
          </label>
          <Input
            type="text"
            placeholder="Your answer"
            value={answers[currentQuestionIndex]}
            onChange={(e) => {
              const newAnswers = [...answers];
              newAnswers[currentQuestionIndex] = e.target.value;
              setAnswers(newAnswers);
              setError('');
            }}
            autoFocus
          />
          {error && (
            <div className="mt-2 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-full ${
                idx < currentQuestionIndex
                  ? 'bg-green-500'
                  : idx === currentQuestionIndex
                  ? 'bg-blue-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleVerifyAnswer}
            className="w-full"
            disabled={answers[currentQuestionIndex].trim().length === 0}
          >
            {currentQuestionIndex < 2 ? 'Next Question' : 'Verify Answers'}
          </Button>
          {currentQuestionIndex > 0 && (
            <Button
              onClick={() => {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
                setError('');
              }}
              variant="secondary"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous Question
            </Button>
          )}
          <Button
            onClick={() => {
              setStep('method');
              setCurrentQuestionIndex(0);
              setAnswers(['', '', '']);
              setError('');
            }}
            variant="secondary"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  // New password creation screen
  const renderNewPasswordCreation = () => {
    return (
      <div>
        <div className="text-center mb-8">
          <Lock className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Create New Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a strong password for your account
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Password strength meter */}
            {newPassword.length > 0 && (
              <div className="mt-3">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      validation.strength < 40
                        ? 'bg-red-500'
                        : validation.strength < 60
                        ? 'bg-orange-500'
                        : validation.strength < 80
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${validation.strength}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Strength:{' '}
                  {validation.strength < 40
                    ? 'Weak'
                    : validation.strength < 60
                    ? 'Fair'
                    : validation.strength < 80
                    ? 'Good'
                    : 'Strong'}
                </p>
              </div>
            )}

            {/* Requirements checklist */}
            <div className="mt-3 space-y-1">
              {[
                { met: validation.length, text: 'At least 12 characters' },
                { met: validation.uppercase, text: 'One uppercase letter' },
                { met: validation.lowercase, text: 'One lowercase letter' },
                { met: validation.number, text: 'One number' },
                { met: validation.special, text: 'One special character' }
              ].map((req, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 text-sm ${
                    req.met
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <CheckCircle className={`w-4 h-4 ${req.met ? '' : 'opacity-30'}`} />
                  {req.text}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
            />
            {confirmPassword.length > 0 && (
              <div className={`mt-2 flex items-center gap-2 text-sm ${
                passwordsMatch
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {passwordsMatch ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Passwords match
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Passwords do not match
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleCompleteReset}
            className="w-full"
            disabled={!canCompleteReset}
          >
            Reset Password
          </Button>
          <Button onClick={onCancel} variant="secondary" className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
        {step === 'method' && renderMethodSelection()}
        {step === 'verify' && method === 'recovery-code' && renderRecoveryCodeVerification()}
        {step === 'verify' && method === 'security-questions' && renderSecurityQuestions()}
        {step === 'new-password' && renderNewPasswordCreation()}
      </div>
    </div>
  );
};
