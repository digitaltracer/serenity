import React, { useState, useCallback, useMemo } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
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
  Trash2,
  FileDown,
  FileUp,
  BarChart3,
  Layers,
  Calendar,
  HardDrive
} from 'lucide-react';

interface EnhancedPrivacySecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: EnhancedPrivacySecuritySettings) => void;
  initialSettings?: EnhancedPrivacySecuritySettings;
}

export interface EnhancedPrivacySecuritySettings {
  // Phase 1 settings
  masterPasswordEnabled: boolean;
  autoLockTimeout: number;
  screenPrivacy: boolean;
  encryptJournalContent: boolean;
  encryptTaskContent: boolean;
  hideFromTaskbar: boolean;
  // Phase 2 settings
  dataRetentionDays: number; // 0 = keep forever
  localOnlyMode: boolean;
  encryptionLevel: 'basic' | 'enhanced' | 'maximum';
  secureDelete: boolean;
  biometricAuth: boolean;
  // Data classification
  dataClassification: {
    journalEntries: 'public' | 'internal' | 'confidential' | 'restricted';
    taskDescriptions: 'public' | 'internal' | 'confidential' | 'restricted';
    taskTitles: 'public' | 'internal' | 'confidential' | 'restricted';
    projectNames: 'public' | 'internal' | 'confidential' | 'restricted';
    tags: 'public' | 'internal' | 'confidential' | 'restricted';
    userNotes: 'public' | 'internal' | 'confidential' | 'restricted';
  };
}

const DEFAULT_SETTINGS: EnhancedPrivacySecuritySettings = {
  masterPasswordEnabled: false,
  autoLockTimeout: 15,
  screenPrivacy: false,
  encryptJournalContent: false,
  encryptTaskContent: false,
  hideFromTaskbar: false,
  dataRetentionDays: 0,
  localOnlyMode: false,
  encryptionLevel: 'basic',
  secureDelete: false,
  biometricAuth: false,
  dataClassification: {
    journalEntries: 'confidential',
    taskDescriptions: 'internal',
    taskTitles: 'internal',
    projectNames: 'internal',
    tags: 'internal',
    userNotes: 'confidential',
  },
};

const CLASSIFICATION_COLORS = {
  public: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
  internal: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
  confidential: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  restricted: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
};

const CLASSIFICATION_DESCRIPTIONS = {
  public: 'No encryption required',
  internal: 'Basic encryption (100K iterations)',
  confidential: 'Strong encryption (200K iterations)',  
  restricted: 'Maximum security (500K iterations)',
};

export const EnhancedPrivacySecurityModal: React.FC<EnhancedPrivacySecurityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSettings = DEFAULT_SETTINGS
}) => {
  const [settings, setSettings] = useState<EnhancedPrivacySecuritySettings>(initialSettings);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [activeTab, setActiveTab] = useState<'security' | 'privacy' | 'encryption' | 'classification' | 'retention' | 'dashboard'>('security');

  const handleSettingChange = useCallback((key: keyof EnhancedPrivacySecuritySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClassificationChange = useCallback((
    dataType: keyof EnhancedPrivacySecuritySettings['dataClassification'], 
    classification: EnhancedPrivacySecuritySettings['dataClassification'][keyof EnhancedPrivacySecuritySettings['dataClassification']]
  ) => {
    setSettings(prev => ({
      ...prev,
      dataClassification: {
        ...prev.dataClassification,
        [dataType]: classification
      }
    }));
  }, []);

  const securityScore = useMemo(() => {
    let score = 0;
    if (settings.masterPasswordEnabled) score += 25;
    if (settings.autoLockTimeout > 0) score += 15;
    if (settings.encryptJournalContent) score += 20;
    if (settings.encryptTaskContent) score += 15;
    if (settings.secureDelete) score += 10;
    if (settings.biometricAuth) score += 10;
    if (settings.encryptionLevel === 'maximum') score += 5;
    return Math.min(100, score);
  }, [settings]);

  const privacyScore = useMemo(() => {
    let score = 0;
    if (settings.screenPrivacy) score += 20;
    if (settings.hideFromTaskbar) score += 15;
    if (settings.localOnlyMode) score += 25;
    if (settings.dataRetentionDays > 0) score += 20;
    
    // Classification scores
    const classificationValues = Object.values(settings.dataClassification);
    const restrictedCount = classificationValues.filter(c => c === 'restricted').length;
    const confidentialCount = classificationValues.filter(c => c === 'confidential').length;
    score += (restrictedCount * 3) + (confidentialCount * 2);
    
    return Math.min(100, score);
  }, [settings]);

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

  const renderTabButton = (
    tab: typeof activeTab, 
    icon: React.ReactNode, 
    label: string,
    badge?: string
  ) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
        activeTab === tab
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {icon}
      {label}
      {badge && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );

  const renderClassificationSelector = (
    dataType: keyof EnhancedPrivacySecuritySettings['dataClassification'],
    label: string,
    description: string
  ) => {
    const currentValue = settings.dataClassification[dataType];
    
    return (
      <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{label}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${CLASSIFICATION_COLORS[currentValue]}`}>
            {currentValue.toUpperCase()}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CLASSIFICATION_COLORS).map(([classification, colorClass]) => (
            <button
              key={classification}
              onClick={() => handleClassificationChange(dataType, classification as any)}
              className={`
                p-2 rounded-lg border text-left text-xs transition-all
                ${currentValue === classification
                  ? `border-current ${colorClass}`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="font-medium capitalize">{classification}</div>
              <div className="text-gray-600 dark:text-gray-400">
                {CLASSIFICATION_DESCRIPTIONS[classification as keyof typeof CLASSIFICATION_DESCRIPTIONS]}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy & Security Center"
      size="xl"
    >
      <div className="space-y-6">
        {/* Header with Dashboard */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Enhanced Security & Privacy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Comprehensive data protection and privacy controls
              </p>
            </div>
          </div>
          
          {/* Security Scores */}
          <div className="flex gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                securityScore >= 80 ? 'text-green-500' : 
                securityScore >= 60 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {securityScore}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Security</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                privacyScore >= 80 ? 'text-green-500' : 
                privacyScore >= 60 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {privacyScore}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Privacy</div>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
          {renderTabButton('dashboard', <BarChart3 className="w-4 h-4" />, 'Dashboard')}
          {renderTabButton('security', <Lock className="w-4 h-4" />, 'Security')}
          {renderTabButton('encryption', <Key className="w-4 h-4" />, 'Encryption')}
          {renderTabButton('classification', <Layers className="w-4 h-4" />, 'Classification')}
          {renderTabButton('privacy', <Eye className="w-4 h-4" />, 'Privacy')}
          {renderTabButton('retention', <Calendar className="w-4 h-4" />, 'Retention')}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Security Overview */}
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Security Status
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Master Password</span>
                    {settings.masterPasswordEnabled ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Auto-Lock</span>
                    {settings.autoLockTimeout > 0 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Data Encryption</span>
                    {settings.encryptJournalContent || settings.encryptTaskContent ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Privacy Overview */}
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Privacy Status
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Screen Privacy</span>
                    {settings.screenPrivacy ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Local-Only Mode</span>
                    {settings.localOnlyMode ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Data Retention</span>
                    {settings.dataRetentionDays > 0 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Quick Actions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button variant="secondary" size="sm" className="flex items-center gap-2">
                  <FileDown className="w-4 h-4" />
                  Export Data
                </Button>
                <Button variant="secondary" size="sm" className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Secure Delete
                </Button>
                <Button variant="secondary" size="sm" className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Clear Cache
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Classification Tab */}
        {activeTab === 'classification' && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
              <div className="flex items-start gap-2">
                <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">Data Classification</p>
                  <p>Configure security levels for different types of data. Higher classifications use stronger encryption.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {renderClassificationSelector('journalEntries', 'Journal Entries', 'Personal thoughts and daily entries')}
              {renderClassificationSelector('taskDescriptions', 'Task Descriptions', 'Detailed task information')}
              {renderClassificationSelector('taskTitles', 'Task Titles', 'Brief task names')}
              {renderClassificationSelector('projectNames', 'Project Names', 'Project identifiers')}
              {renderClassificationSelector('tags', 'Tags', 'Organizational labels')}
              {renderClassificationSelector('userNotes', 'User Notes', 'Personal annotations')}
            </div>
          </div>
        )}

        {/* Retention Tab */}
        {activeTab === 'retention' && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data Retention Policy
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Automatically delete old data after specified period
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: 0, label: 'Keep Forever' },
                  { value: 30, label: '30 Days' },
                  { value: 90, label: '90 Days' },
                  { value: 365, label: '1 Year' },
                  { value: 730, label: '2 Years' },
                  { value: 1825, label: '5 Years' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSettingChange('dataRetentionDays', option.value)}
                    className={`
                      p-3 rounded-lg border text-center transition-all text-sm
                      ${settings.dataRetentionDays === option.value
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional retention settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Secure Delete</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cryptographically erase deleted data
                    </p>
                  </div>
                </div>
                {renderToggle(
                  settings.secureDelete,
                  (checked) => handleSettingChange('secureDelete', checked)
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Local-Only Mode</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Disable all cloud sync and external connections
                    </p>
                  </div>
                </div>
                {renderToggle(
                  settings.localOnlyMode,
                  (checked) => handleSettingChange('localOnlyMode', checked)
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Encryption Tab */}
        {activeTab === 'encryption' && (
          <div className="space-y-6">
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Encryption Level
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'basic', label: 'Basic', desc: '100K iterations' },
                  { value: 'enhanced', label: 'Enhanced', desc: '200K iterations' },
                  { value: 'maximum', label: 'Maximum', desc: '500K iterations' }
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() => handleSettingChange('encryptionLevel', level.value)}
                    className={`
                      p-3 rounded-lg border text-center transition-all
                      ${settings.encryptionLevel === level.value
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="font-medium">{level.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Encryption Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Encrypt Journal Content</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Encrypt journal entries before storing
                    </p>
                  </div>
                </div>
                {renderToggle(
                  settings.encryptJournalContent,
                  (checked) => handleSettingChange('encryptJournalContent', checked)
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Encrypt Task Content</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Encrypt task descriptions and sensitive data
                    </p>
                  </div>
                </div>
                {renderToggle(
                  settings.encryptTaskContent,
                  (checked) => handleSettingChange('encryptTaskContent', checked)
                )}
              </div>
            </div>
          </div>
        )}

        {/* Keep existing Security and Privacy tabs... */}
        {/* (Previous security and privacy tab content goes here) */}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button 
            onClick={() => onSave(settings)} 
            className="flex-1"
          >
            Save All Settings
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};