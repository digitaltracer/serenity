import { useState, useEffect, useCallback } from 'react';
import { logger } from '@serenity/core';

export interface ModalFormHookProps<T> {
  isOpen: boolean;
  item?: T | null;
  initialData: T;
  onSubmit: (data: T) => void;
  onClose: () => void;
}

export function useModalForm<T extends Record<string, any>>({
  isOpen,
  item,
  initialData,
  onSubmit,
  onClose,
}: ModalFormHookProps<T>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  // Reset form when modal opens/closes or item changes
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({ ...item } as T);
      } else {
        setFormData(initialData);
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, item, initialData]);

  const updateField = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      logger.error('Form submission error:', { component: 'useModalForm', operation: 'formSubmissionError:' }, error as Error);
      // Keep modal open on error
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  return {
    formData,
    updateField,
    handleSubmit,
    handleClose,
    isSubmitting,
    errors,
    setFieldError,
    clearErrors,
    isEditing: !!item,
  };
}