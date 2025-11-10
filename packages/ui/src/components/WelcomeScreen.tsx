import React from 'react';
import { Button } from './Button';
import { Shield, Lock, Fingerprint, CheckCircle, AlertTriangle } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Main Content */}
      <div className="relative w-full max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl shadow-blue-500/30 animate-pulse">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Serenity Notes
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Privacy-First Productivity
          </p>
          <p className="text-md text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Your personal workspace for tasks, notes, and goals — all protected with military-grade encryption
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Encrypted & Secure"
            description="Your data is protected with AES-256 encryption. Only you can access your information."
          />
          <FeatureCard
            icon={<Lock className="w-6 h-6" />}
            title="Master Password"
            description="Create a single password that unlocks everything. Your data stays private, always."
          />
          <FeatureCard
            icon={<Fingerprint className="w-6 h-6" />}
            title="Biometric Auth"
            description="Quick access with Touch ID, Face ID, or Windows Hello on supported devices."
          />
        </div>

        {/* What You'll Get */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-8 mb-8 border border-gray-200/50 dark:border-gray-700/30 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Everything You Need to Stay Organized
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">ActionHub</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Powerful task management with projects, priorities, and subtasks
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Journal</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Rich text journaling with tags, mood tracking, and search
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Productivity insights with charts, trends, and AI recommendations
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Cross-Platform</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Works seamlessly on desktop with mobile support coming soon
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button
            onClick={onGetStarted}
            className="px-12 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
          >
            Get Started
          </Button>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Setup takes less than 2 minutes
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-1">
                Important Security Notice
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-300">
                Your master password <strong>cannot be recovered</strong> if lost.
                We recommend setting up recovery options during the next step and storing
                your password in a secure location.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Serenity Notes v0.1.0 • Built with Privacy in Mind
          </p>
        </div>
      </div>
    </div>
  );
};
