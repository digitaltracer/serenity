import React, { useState, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { logger } from '@serenity/core';
import {
  AlertTriangle,
  Download,
  Trash2,
  RefreshCw,
  Shield,
  Database,
  FileX,
  CheckCircle
} from 'lucide-react';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetPassword: () => Promise<void>;
  onFactoryReset: () => Promise<void>;
  onExportData?: () => Promise<void>;
}

type ResetStep = 'warning' | 'options' | 'confirm-reset' | 'confirm-factory' | 'processing' | 'complete';

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  onResetPassword,
  onFactoryReset,
  onExportData
}) => {
  const [currentStep, setCurrentStep] = useState<ResetStep>('warning');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasExportedData, setHasExportedData] = useState(false);

  const handleExportData = useCallback(async () => {
    if (onExportData) {
      setIsProcessing(true);
      try {
        await onExportData();
        setHasExportedData(true);
      } catch (error) {
        logger.error('Export failed:', { component: 'PasswordResetModal', operation: 'exportFailed:' }, error as Error);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [onExportData]);

  const handleResetPassword = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onResetPassword();
      setCurrentStep('complete');
    } catch (error) {
      logger.error('Password reset failed:', { component: 'PasswordResetModal', operation: 'passwordResetFailed:' }, error as Error);
    } finally {
      setIsProcessing(false);
    }
  }, [onResetPassword]);

  const handleFactoryReset = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onFactoryReset();
      setCurrentStep('complete');
    } catch (error) {
      logger.error('Factory reset failed:', { component: 'PasswordResetModal', operation: 'factoryResetFailed:' }, error as Error);
    } finally {
      setIsProcessing(false);
    }
  }, [onFactoryReset]);

  const handleClose = useCallback(() => {
    setCurrentStep('warning');
    setIsProcessing(false);
    setHasExportedData(false);
    onClose();
  }, [onClose]);

  const renderWarningStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Password Recovery Required
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You've forgotten your master password and need to reset it.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-red-800 dark:text-red-200">
            <p className="font-medium mb-2">⚠️ Important Data Warning</p>
            <ul className="space-y-1 text-sm">
              <li>• All encrypted data will be permanently lost</li>
              <li>• Journal entries and sensitive task data cannot be recovered</li>
              <li>• This action cannot be undone</li>
              <li>• We recommend exporting unencrypted data first</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={() => setCurrentStep('options')} 
          className="flex-1"
          variant="destructive"
        >
          I Understand, Continue
        </Button>
        <Button 
          variant="ghost" 
          onClick={handleClose} 
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderOptionsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Recovery Options
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Choose how you want to proceed with password recovery.
        </p>
      </div>

      {/* Export Data Option */}
      {onExportData && (
        <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Export Unencrypted Data First (Recommended)
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Export your tasks, projects, and non-sensitive data before resetting.
                Encrypted journal entries cannot be recovered.
              </p>
              <Button 
                onClick={handleExportData} 
                size="sm"
                disabled={isProcessing || hasExportedData}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {hasExportedData ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Data Exported
                  </>
                ) : isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Option */}
      <div className="p-4 rounded-lg border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
              Reset Master Password Only
            </h4>
            <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
              Remove master password protection but keep all unencrypted data.
              Encrypted data will be permanently lost.
            </p>
            <Button 
              onClick={() => setCurrentStep('confirm-reset')} 
              size="sm"
              variant="secondary"
              disabled={isProcessing}
            >
              <Shield className="w-4 h-4 mr-2" />
              Reset Password
            </Button>
          </div>
        </div>
      </div>

      {/* Factory Reset Option */}
      <div className="p-4 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
              Factory Reset (Nuclear Option)
            </h4>
            <p className="text-sm text-red-800 dark:text-red-200 mb-3">
              Delete ALL data and start fresh. This removes everything including
              settings, preferences, and all content.
            </p>
            <Button 
              onClick={() => setCurrentStep('confirm-factory')} 
              size="sm"
              variant="destructive"
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Factory Reset
            </Button>
          </div>
        </div>
      </div>

      <Button variant="ghost" onClick={handleClose} className="w-full">
        Cancel
      </Button>
    </div>
  );

  const renderConfirmResetStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
          <Shield className="w-8 h-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Confirm Password Reset
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This will remove your master password and delete all encrypted data.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50">
        <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">What will happen:</h4>
        <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
          <li>✓ Master password requirement will be removed</li>
          <li>✓ App will no longer lock automatically</li>
          <li>✓ Basic tasks and projects will be preserved</li>
          <li>✗ Encrypted journal entries will be permanently deleted</li>
          <li>✗ Encrypted task descriptions will be lost</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={handleResetPassword} 
          className="flex-1"
          variant="destructive"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            'Confirm Reset Password'
          )}
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => setCurrentStep('options')} 
          className="flex-1"
          disabled={isProcessing}
        >
          Go Back
        </Button>
      </div>
    </div>
  );

  const renderConfirmFactoryStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
          <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Confirm Factory Reset
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This will delete ALL data and cannot be undone.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50">
        <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">⚠️ Complete Data Loss:</h4>
        <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
          <li>✗ All tasks and projects will be deleted</li>
          <li>✗ All journal entries will be permanently lost</li>
          <li>✗ All settings and preferences will be reset</li>
          <li>✗ All user data will be completely wiped</li>
          <li>✓ App will restart in fresh state</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button 
          onClick={handleFactoryReset} 
          className="flex-1"
          variant="destructive"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            'DELETE EVERYTHING'
          )}
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => setCurrentStep('options')} 
          className="flex-1"
          disabled={isProcessing}
        >
          Go Back
        </Button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-6 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Reset Complete
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Your password has been reset successfully. The app will now restart.
      </p>
      <Button onClick={handleClose} className="w-full">
        Continue
      </Button>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 'warning':
        return renderWarningStep();
      case 'options':
        return renderOptionsStep();
      case 'confirm-reset':
        return renderConfirmResetStep();
      case 'confirm-factory':
        return renderConfirmFactoryStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderWarningStep();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={currentStep === 'complete' ? handleClose : () => {}}
      title="Password Recovery"
      size="lg"
    >
      {getStepContent()}
    </Modal>
  );
};