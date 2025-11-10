import React, { useState, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { logger } from '@serenity/core';
import {
  Lock,
  Shield,
  Eye,
  EyeOff,
  Clock,
  Monitor,
  Key,
  Database,
  AlertTriangle,
  CheckCircle,
  Settings,
  Loader
} from 'lucide-react';

interface PrivacySecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: PrivacySecuritySettings) => void;
  initialSettings?: PrivacySecuritySettings;
}

export interface PrivacySecuritySettings {
  masterPasswordEnabled: boolean;
  autoLockTimeout: number; // minutes, 0 = never
  screenPrivacy: boolean;
  encryptJournalContent: boolean;
  encryptTaskContent: boolean;
  hideFromTaskbar: boolean;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  suggestions: string[];
}

const DEFAULT_SETTINGS: PrivacySecuritySettings = {
  masterPasswordEnabled: false,
  autoLockTimeout: 15,
  screenPrivacy: false,
  encryptJournalContent: false,
  encryptTaskContent: false,
  hideFromTaskbar: false,
};

export const PrivacySecurityModal: React.FC<PrivacySecurityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSettings = DEFAULT_SETTINGS
}) => {
  const [settings, setSettings] = useState<PrivacySecuritySettings>(initialSettings);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [activeTab, setActiveTab] = useState<'security' | 'privacy' | 'encryption'>('security');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatePasswordStrength = useCallback((password: string): PasswordStrength => {
    if (!password) return { score: 0, label: 'No password', color: 'text-gray-400', suggestions: [] };
    
    let score = 0;
    const suggestions: string[] = [];
    
    if (password.length >= 8) score++;
    else suggestions.push('At least 8 characters');
    
    if (/[A-Z]/.test(password)) score++;
    else suggestions.push('Include uppercase letters');
    
    if (/[a-z]/.test(password)) score++;
    else suggestions.push('Include lowercase letters');
    
    if (/[0-9]/.test(password)) score++;
    else suggestions.push('Include numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score++;
    else suggestions.push('Include special characters');
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = [
      'text-red-500',
      'text-red-400', 
      'text-yellow-500',
      'text-blue-500',
      'text-green-500'
    ];
    
    return {
      score,
      label: labels[Math.min(score, 4)],
      color: colors[Math.min(score, 4)],
      suggestions
    };
  }, []);

  const passwordStrength = calculatePasswordStrength(newPassword);

  const handleSettingChange = useCallback((key: keyof PrivacySecuritySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate password fields if master password is being enabled
      if (settings.masterPasswordEnabled) {
        const validationErrors: Record<string, string> = {};

        // Check if password is required when enabling master password
        if (!initialSettings.masterPasswordEnabled && !newPassword) {
          validationErrors.newPassword = 'New password is required when enabling master password';
        }

        // Check password confirmation
        if (newPassword && newPassword !== confirmPassword) {
          validationErrors.confirmPassword = 'Passwords do not match';
        }

        // Check password strength
        if (newPassword && passwordStrength.score < 2) {
          validationErrors.newPassword = 'Password is too weak. Please use a stronger password.';
        }

        // Check current password if master password already exists
        if (initialSettings.masterPasswordEnabled && !currentPassword) {
          validationErrors.currentPassword = 'Current password is required';
        }

        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          setIsSubmitting(false);
          return;
        }

        // Validate current password if provided
        if (initialSettings.masterPasswordEnabled && currentPassword) {
          try {
            const { validateMasterPasswordSecure } = await import('@serenity/core');
            const isCurrentPasswordValid = await validateMasterPasswordSecure(currentPassword);
            if (!isCurrentPasswordValid) {
              setErrors({ currentPassword: 'Current password is incorrect' });
              setIsSubmitting(false);
              return;
            }
          } catch (error) {
            logger.error('Failed to validate current password:', { component: 'PrivacySecurityModal', operation: 'failedValidateCurrent' }, error as Error);
            setErrors({ currentPassword: 'Failed to validate current password' });
            setIsSubmitting(false);
            return;
          }
        }

        // Save new password hash if provided
        if (newPassword) {
          try {
            const { saveMasterPasswordHashSecure } = await import('@serenity/core');
            await saveMasterPasswordHashSecure(newPassword);
          } catch (error) {
            logger.error('Failed to save master password:', { component: 'PrivacySecurityModal', operation: 'failedSaveMaster' }, error as Error);
            setErrors({ general: 'Failed to save master password. Please try again.' });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Save settings
      onSave(settings);
      
      // Clear form and close
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswords({ current: false, new: false, confirm: false });
      onClose();

    } catch (error) {
      logger.error('Failed to save settings:', { component: 'PrivacySecurityModal', operation: 'failedSaveSettings:' }, error as Error);
      setErrors({ general: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    settings, 
    newPassword, 
    confirmPassword, 
    currentPassword,
    passwordStrength.score, 
    initialSettings.masterPasswordEnabled,
    onSave, 
    onClose
  ]);

  const handleClose = useCallback(() => {
    setSettings(initialSettings);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswords({ current: false, new: false, confirm: false });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  }, [initialSettings, onClose]);

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const renderTabButton = (tab: typeof activeTab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        activeTab === tab
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const renderToggle = (
    checked: boolean,
    onChange: (checked: boolean) => void,
    disabled?: boolean
  ) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-out
        focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:ring-offset-2
        ${checked 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30' 
          : 'bg-gray-200 dark:bg-gray-700 shadow-inner'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-all duration-300
          ${checked ? 'translate-x-6 shadow-lg' : 'translate-x-1 shadow-sm'}
        `}
      />
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Privacy & Security"
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Security & Privacy Settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Protect your personal data and control access to your information
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {renderTabButton('security', <Lock className="w-4 h-4" />, 'Security')}
          {renderTabButton('privacy', <Eye className="w-4 h-4" />, 'Privacy')}
          {renderTabButton('encryption', <Database className="w-4 h-4" />, 'Encryption')}
        </div>

        {/* Tab Content */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Master Password */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Master Password</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Require a password to access the application
                  </p>
                </div>
                {renderToggle(
                  settings.masterPasswordEnabled,
                  (checked) => handleSettingChange('masterPasswordEnabled', checked)
                )}
              </div>

              {settings.masterPasswordEnabled && (
                <div className="ml-4 space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
                  {initialSettings.masterPasswordEnabled && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className={`pr-10 ${errors.currentPassword ? 'border-red-300 dark:border-red-600' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {errors.currentPassword}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className={`pr-10 ${errors.newPassword ? 'border-red-300 dark:border-red-600' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.newPassword}
                      </p>
                    )}
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                passwordStrength.score === 0 ? 'w-0' :
                                passwordStrength.score === 1 ? 'w-1/5 bg-red-500' :
                                passwordStrength.score === 2 ? 'w-2/5 bg-yellow-500' :
                                passwordStrength.score === 3 ? 'w-3/5 bg-blue-500' :
                                'w-full bg-green-500'
                              }`}
                            />
                          </div>
                          <span className={`text-xs font-medium ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        {passwordStrength.suggestions.length > 0 && (
                          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                            {passwordStrength.suggestions.map((suggestion, index) => (
                              <li key={index} className="flex items-center gap-1">
                                <div className="w-1 h-1 bg-current rounded-full" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className={`pr-10 ${errors.confirmPassword ? 'border-red-300 dark:border-red-600' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.confirmPassword}
                      </p>
                    )}
                    {!errors.confirmPassword && confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Passwords do not match
                      </p>
                    )}
                    {!errors.confirmPassword && confirmPassword && newPassword === confirmPassword && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Passwords match
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Auto-Lock */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Auto-Lock Timeout
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Automatically lock the app after period of inactivity
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 5, label: '5 min' },
                  { value: 15, label: '15 min' },
                  { value: 30, label: '30 min' },
                  { value: 0, label: 'Never' }
                ].map((timeout) => (
                  <button
                    key={timeout.value}
                    onClick={() => handleSettingChange('autoLockTimeout', timeout.value)}
                    className={`
                      p-3 rounded-lg border text-center transition-all
                      ${settings.autoLockTimeout === timeout.value
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="text-sm font-medium">{timeout.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            {/* Screen Privacy */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Screen Privacy</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hide content when screen sharing or taking screenshots
                  </p>
                </div>
              </div>
              {renderToggle(
                settings.screenPrivacy,
                (checked) => handleSettingChange('screenPrivacy', checked)
              )}
            </div>

            {/* Hide from Taskbar */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Hide from Taskbar</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hide app from taskbar and recent apps when locked
                  </p>
                </div>
              </div>
              {renderToggle(
                settings.hideFromTaskbar,
                (checked) => handleSettingChange('hideFromTaskbar', checked)
              )}
            </div>
          </div>
        )}

        {activeTab === 'encryption' && (
          <div className="space-y-6">
            {/* Journal Encryption */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Encrypt Journal Content</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Encrypt journal entries before storing in database
                  </p>
                </div>
              </div>
              {renderToggle(
                settings.encryptJournalContent,
                (checked) => handleSettingChange('encryptJournalContent', checked)
              )}
            </div>

            {/* Task Encryption */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Encrypt Task Content</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Encrypt sensitive task descriptions and notes
                  </p>
                </div>
              </div>
              {renderToggle(
                settings.encryptTaskContent,
                (checked) => handleSettingChange('encryptTaskContent', checked)
              )}
            </div>

            {/* Encryption Notice */}
            {(settings.encryptJournalContent || settings.encryptTaskContent) && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">Encryption Notice</p>
                    <p>Encrypted data requires your master password to decrypt. If you forget your password, this data cannot be recovered.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* General Error Message */}
        {errors.general && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                {errors.general}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            onClick={handleSave} 
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleClose} 
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};