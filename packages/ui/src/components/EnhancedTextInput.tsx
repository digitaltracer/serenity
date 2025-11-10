import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { Button } from './Button';

export interface EnhancedTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  helperText?: string;
  badge?: string;
  isProcessing?: boolean;
  disabled?: boolean;
  className?: string;
  submitLabel?: string;
}

const EnhancedTextInput = React.forwardRef<HTMLTextAreaElement, EnhancedTextInputProps>(
  ({
    value,
    onChange,
    onSubmit,
    placeholder,
    helperText,
    badge,
    isProcessing = false,
    disabled = false,
    className,
    submitLabel = 'Submit',
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
        e.preventDefault();
        if (value.trim() && !isProcessing) {
          onSubmit();
        }
      }
    };

    return (
      <div className={cn("w-full max-w-4xl mx-auto mb-8", className)}>
        <div className="relative group">
          {/* Gradient border effect */}
          <div className={cn(
            "absolute -inset-[2px] bg-gradient-to-r from-primary via-purple-500 to-primary rounded-2xl transition-all duration-500",
            isFocused || value ? "opacity-100 blur-md" : "opacity-0 blur-sm group-hover:opacity-50"
          )} />

          {/* Main input container */}
          <div className="relative bg-card/80 dark:bg-card/60 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden border border-border/50">
            {/* Subtle top highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <textarea
              ref={ref}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled || isProcessing}
              placeholder={placeholder}
              className={cn(
                "w-full min-h-[180px] bg-transparent border-none p-8 text-base leading-relaxed resize-none",
                "focus:outline-none focus:ring-0 placeholder:text-muted-foreground/60",
                isProcessing && "opacity-70 cursor-not-allowed"
              )}
            />

            {/* Bottom info bar */}
            {(helperText || badge || onSubmit) && (
              <div className="border-t border-border/50 px-8 py-4 bg-muted/30 backdrop-blur-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {helperText && (
                  <p className="text-sm text-muted-foreground md:flex-1">
                    {helperText}
                  </p>
                )}
                <div className="flex items-center gap-3 md:justify-end">
                  {badge && (
                    <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                      {badge}
                    </span>
                  )}
                  {onSubmit && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={onSubmit}
                      disabled={disabled || isProcessing || !value.trim()}
                    >
                      {submitLabel}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

EnhancedTextInput.displayName = 'EnhancedTextInput';

export { EnhancedTextInput };
