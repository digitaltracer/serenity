import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './Button';

export interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  variant?: 'dropdown' | 'cycle';
  size?: 'sm' | 'md';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  theme, 
  onThemeChange, 
  variant = 'cycle',
  size = 'sm'
}) => {
  const getNextTheme = (current: string) => {
    switch (current) {
      case 'light': return 'dark';
      case 'dark': return 'system';
      case 'system': return 'light';
      default: return 'light';
    }
  };

  const handleCycleTheme = () => {
    const nextTheme = getNextTheme(theme);
    onThemeChange(nextTheme as 'light' | 'dark' | 'system');
  };

  const getIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="w-4 h-4" />;
      case 'dark': return <Moon className="w-4 h-4" />;
      case 'system': return <Monitor className="w-4 h-4" />;
      default: return <Sun className="w-4 h-4" />;
    }
  };

  const getTooltip = () => {
    switch (theme) {
      case 'light': return 'Switch to dark mode';
      case 'dark': return 'Switch to system mode';
      case 'system': return 'Switch to light mode';
      default: return 'Toggle theme';
    }
  };

  if (variant === 'cycle') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={handleCycleTheme}
        title={getTooltip()}
        className="transition-all duration-150 hover:bg-gray-200 text-gray-600 hover:text-gray-900 dark:hover:bg-gray-800/40 dark:text-gray-400 dark:hover:text-white"
      >
        {getIcon()}
      </Button>
    );
  }

  // Dropdown variant for settings page
  return (
    <div className="flex gap-1">
      {[
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
      ].map((option) => {
        const Icon = option.icon;
        return (
          <Button
            key={option.value}
            variant={theme === option.value ? 'primary' : 'ghost'}
            size={size}
            onClick={() => onThemeChange(option.value as 'light' | 'dark' | 'system')}
            title={option.label}
            className="transition-all"
          >
            <Icon className="w-4 h-4" />
          </Button>
        );
      })}
    </div>
  );
};

export { ThemeToggle };