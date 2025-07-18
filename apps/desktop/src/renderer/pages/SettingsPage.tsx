import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectTheme, 
  selectCompactMode, 
  setTheme, 
  setCompactMode 
} from '@serenity/core';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@serenity/ui';
import { 
  Settings, 
  Palette, 
  Bell, 
  User, 
  Database, 
  Shield, 
  Globe,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const currentTheme = useSelector(selectTheme);
  const compactMode = useSelector(selectCompactMode);
  
  // Local state for features not yet in Redux
  const [notifications, setNotifications] = React.useState(true);
  const [sounds, setSounds] = React.useState(true);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your Serenity Notes experience
        </p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Theme
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor }
                ].map((theme) => {
                  const Icon = theme.icon;
                  return (
                    <Button
                      key={theme.value}
                      variant={currentTheme === theme.value ? 'primary' : 'secondary'}
                      onClick={() => dispatch(setTheme(theme.value as 'light' | 'dark' | 'system'))}
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {theme.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Compact Mode</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reduce spacing for more content
                </p>
              </div>
              <Button
                variant={compactMode ? 'primary' : 'secondary'}
                onClick={() => dispatch(setCompactMode(!compactMode))}
              >
                {compactMode ? 'On' : 'Off'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Notifications</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enable task reminders and updates
                </p>
              </div>
              <Button
                variant={notifications ? 'primary' : 'secondary'}
                onClick={() => setNotifications(!notifications)}
              >
                {notifications ? 'On' : 'Off'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Sounds</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Play sounds for notifications
                </p>
              </div>
              <Button
                variant={sounds ? 'primary' : 'secondary'}
                onClick={() => setSounds(!sounds)}
              >
                {sounds ? 'On' : 'Off'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Account Information</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View and update your account details
                </p>
              </div>
              <Button variant="secondary">Manage</Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Export Data</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Download all your data as JSON
                </p>
              </div>
              <Button variant="secondary">Export</Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Language
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
                <option value="en">English (US)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Data Storage</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure database connection
                </p>
              </div>
              <Button variant="secondary">Configure</Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Privacy</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage privacy settings
                </p>
              </div>
              <Button variant="secondary">Manage</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};