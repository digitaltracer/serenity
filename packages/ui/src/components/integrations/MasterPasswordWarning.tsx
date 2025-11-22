'use client'

import React from 'react';
import { Card, CardContent } from '../Card';
import { Button } from '../Button';
import { Shield, Lock } from 'lucide-react';

export interface MasterPasswordWarningProps {
  onSetupMasterPassword: () => void;
}

export const MasterPasswordWarning: React.FC<MasterPasswordWarningProps> = ({
  onSetupMasterPassword,
}) => {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
      <CardContent>
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800 dark:text-amber-200">Master Password Required</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              A master password is required to connect integrations for security reasons.
              Integration tokens will be encrypted and stored securely.
            </p>
            <Button
              variant="secondary"
              className="mt-3 text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-200 dark:border-amber-600 dark:hover:bg-amber-800/30"
              onClick={onSetupMasterPassword}
            >
              Set Up Master Password
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export interface LoadSavedIntegrationsCardProps {
  onLoadIntegrations: () => void;
}

export const LoadSavedIntegrationsCard: React.FC<LoadSavedIntegrationsCardProps> = ({
  onLoadIntegrations,
}) => {
  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
      <CardContent>
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-200">Saved Integrations Found</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              You have encrypted integrations saved in the database.
              Enter your master password to load them.
            </p>
            <Button
              variant="secondary"
              className="mt-3 text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-200 dark:border-blue-600 dark:hover:bg-blue-800/30"
              onClick={onLoadIntegrations}
            >
              <Lock className="w-4 h-4 mr-2" />
              Load Saved Integrations
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
