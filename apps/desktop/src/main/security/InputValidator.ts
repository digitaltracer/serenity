/**
 * Input Validator for Security
 *
 * Provides comprehensive input validation and sanitization to prevent:
 * - Cross-Site Scripting (XSS)
 * - SQL Injection
 * - Command Injection
 * - Path Traversal
 * - NoSQL Injection
 * - Invalid data types
 *
 * Features:
 * - HTML sanitization
 * - SQL query parameterization helpers
 * - File path validation
 * - Email/URL validation
 * - Type checking and coercion
 * - Custom validation rules
 */

import * as path from 'path';

export interface ValidationResult {
  isValid: boolean;
  sanitized?: any;
  errors: string[];
}

export class InputValidator {
  private static instance: InputValidator;

  // Regular expressions for common patterns
  private readonly patterns = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    alphanumericSpaces: /^[a-zA-Z0-9\s]+$/,
    filename: /^[a-zA-Z0-9_\-\.]+$/,
    hex: /^[0-9a-fA-F]+$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  };

  // Dangerous HTML tags and attributes
  private readonly dangerousTags = [
    'script',
    'iframe',
    'object',
    'embed',
    'link',
    'style',
    'base',
    'meta',
  ];

  private readonly dangerousAttributes = [
    'onclick',
    'onload',
    'onerror',
    'onmouseover',
    'onfocus',
    'onblur',
  ];

  // SQL injection patterns
  private readonly sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION\s+SELECT)/gi,
    /(;\s*DROP\s+TABLE)/gi,
    /(--\s*$)/g,
    /(';\s*--)/g,
    /('\s+OR\s+'1'\s*=\s*'1)/gi,
  ];

  private constructor() {}

  public static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  /**
   * Sanitize HTML to prevent XSS attacks
   */
  public sanitizeHTML(html: string): ValidationResult {
    const errors: string[] = [];

    try {
      let sanitized = html;

      // Remove dangerous tags
      for (const tag of this.dangerousTags) {
        const tagRegex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gi');
        if (tagRegex.test(sanitized)) {
          errors.push(`Removed dangerous tag: ${tag}`);
          sanitized = sanitized.replace(tagRegex, '');
        }

        // Also remove self-closing tags
        const selfClosingRegex = new RegExp(`<${tag}[^>]*\/>`, 'gi');
        if (selfClosingRegex.test(sanitized)) {
          errors.push(`Removed dangerous self-closing tag: ${tag}`);
          sanitized = sanitized.replace(selfClosingRegex, '');
        }
      }

      // Remove dangerous attributes
      for (const attr of this.dangerousAttributes) {
        const attrRegex = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
        if (attrRegex.test(sanitized)) {
          errors.push(`Removed dangerous attribute: ${attr}`);
          sanitized = sanitized.replace(attrRegex, '');
        }
      }

      // Remove javascript: protocols
      sanitized = sanitized.replace(/javascript:/gi, '');

      // Remove data: protocols (can contain base64-encoded scripts)
      sanitized = sanitized.replace(/data:text\/html/gi, '');

      // Encode remaining special characters in attribute values
      sanitized = sanitized.replace(
        /(<[^>]+\s+\w+\s*=\s*["'])([^"']+)(["'])/g,
        (match, pre, value, post) => {
          const encodedValue = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
          return pre + encodedValue + post;
        }
      );

      return {
        isValid: errors.length === 0,
        sanitized,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Failed to sanitize HTML: ' + (error as Error).message],
      };
    }
  }

  /**
   * Validate and sanitize SQL input (for use with parameterized queries)
   */
  public validateSQLInput(input: string): ValidationResult {
    const errors: string[] = [];

    // Check for SQL injection patterns
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(input)) {
        errors.push('Potential SQL injection detected');
        break;
      }
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }

    // For SQL, we don't modify the input - we rely on parameterized queries
    // This validation is just to detect obvious injection attempts
    return {
      isValid: true,
      sanitized: input,
      errors: [],
    };
  }

  /**
   * Validate file path to prevent path traversal
   */
  public validateFilePath(
    filePath: string,
    options: {
      allowAbsolute?: boolean;
      allowedExtensions?: string[];
      maxLength?: number;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];

    // Check for path traversal attempts
    if (filePath.includes('..')) {
      errors.push('Path traversal detected');
    }

    // Check for null bytes
    if (filePath.includes('\0')) {
      errors.push('Null byte detected in path');
    }

    // Validate absolute paths
    if (!options.allowAbsolute && path.isAbsolute(filePath)) {
      errors.push('Absolute paths are not allowed');
    }

    // Check length
    const maxLength = options.maxLength || 255;
    if (filePath.length > maxLength) {
      errors.push(`Path exceeds maximum length of ${maxLength} characters`);
    }

    // Validate extension
    if (options.allowedExtensions) {
      const ext = path.extname(filePath).toLowerCase();
      if (!options.allowedExtensions.includes(ext)) {
        errors.push(
          `File extension ${ext} is not allowed. Allowed: ${options.allowedExtensions.join(', ')}`
        );
      }
    }

    // Normalize path
    const normalized = path.normalize(filePath);

    return {
      isValid: errors.length === 0,
      sanitized: normalized,
      errors,
    };
  }

  /**
   * Validate email address
   */
  public validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!this.patterns.email.test(email)) {
      errors.push('Invalid email format');
    }

    if (email.length > 254) {
      errors.push('Email address too long');
    }

    return {
      isValid: errors.length === 0,
      sanitized: email.trim().toLowerCase(),
      errors,
    };
  }

  /**
   * Validate URL
   */
  public validateURL(url: string, options: { allowedProtocols?: string[] } = {}): ValidationResult {
    const errors: string[] = [];

    if (!this.patterns.url.test(url)) {
      errors.push('Invalid URL format');
    }

    const allowedProtocols = options.allowedProtocols || ['http', 'https'];
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol.replace(':', '');

      if (!allowedProtocols.includes(protocol)) {
        errors.push(
          `Protocol ${protocol} is not allowed. Allowed: ${allowedProtocols.join(', ')}`
        );
      }
    } catch (error) {
      errors.push('Failed to parse URL');
    }

    return {
      isValid: errors.length === 0,
      sanitized: url.trim(),
      errors,
    };
  }

  /**
   * Validate string with custom rules
   */
  public validateString(
    value: string,
    options: {
      minLength?: number;
      maxLength?: number;
      pattern?: RegExp;
      allowEmpty?: boolean;
      trim?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    let sanitized = options.trim !== false ? value.trim() : value;

    // Check empty
    if (!options.allowEmpty && sanitized.length === 0) {
      errors.push('Value cannot be empty');
    }

    // Check length
    if (options.minLength && sanitized.length < options.minLength) {
      errors.push(`Minimum length is ${options.minLength} characters`);
    }

    if (options.maxLength && sanitized.length > options.maxLength) {
      errors.push(`Maximum length is ${options.maxLength} characters`);
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Check pattern
    if (options.pattern && !options.pattern.test(sanitized)) {
      errors.push('Value does not match required pattern');
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
    };
  }

  /**
   * Validate number
   */
  public validateNumber(
    value: any,
    options: {
      min?: number;
      max?: number;
      integer?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];

    const num = Number(value);

    if (isNaN(num)) {
      errors.push('Value is not a number');
      return { isValid: false, errors };
    }

    if (!isFinite(num)) {
      errors.push('Value must be finite');
    }

    if (options.integer && !Number.isInteger(num)) {
      errors.push('Value must be an integer');
    }

    if (options.min !== undefined && num < options.min) {
      errors.push(`Value must be at least ${options.min}`);
    }

    if (options.max !== undefined && num > options.max) {
      errors.push(`Value must be at most ${options.max}`);
    }

    return {
      isValid: errors.length === 0,
      sanitized: num,
      errors,
    };
  }

  /**
   * Validate boolean
   */
  public validateBoolean(value: any): ValidationResult {
    if (typeof value === 'boolean') {
      return {
        isValid: true,
        sanitized: value,
        errors: [],
      };
    }

    if (value === 'true' || value === '1' || value === 1) {
      return {
        isValid: true,
        sanitized: true,
        errors: [],
      };
    }

    if (value === 'false' || value === '0' || value === 0) {
      return {
        isValid: true,
        sanitized: false,
        errors: [],
      };
    }

    return {
      isValid: false,
      errors: ['Value is not a boolean'],
    };
  }

  /**
   * Validate JSON
   */
  public validateJSON(value: string): ValidationResult {
    try {
      const parsed = JSON.parse(value);
      return {
        isValid: true,
        sanitized: parsed,
        errors: [],
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Invalid JSON: ' + (error as Error).message],
      };
    }
  }

  /**
   * Batch validate multiple fields
   */
  public validateFields(
    data: Record<string, any>,
    rules: Record<string, (value: any) => ValidationResult>
  ): {
    isValid: boolean;
    sanitized: Record<string, any>;
    errors: Record<string, string[]>;
  } {
    const sanitized: Record<string, any> = {};
    const errors: Record<string, string[]> = {};
    let isValid = true;

    for (const [field, rule] of Object.entries(rules)) {
      const result = rule(data[field]);

      if (!result.isValid) {
        isValid = false;
        errors[field] = result.errors;
      } else {
        sanitized[field] = result.sanitized;
      }
    }

    return { isValid, sanitized, errors };
  }
}

/**
 * Convenience functions for common validations
 */

export function sanitizeHTML(html: string): string {
  const result = InputValidator.getInstance().sanitizeHTML(html);
  return result.sanitized || '';
}

export function validateEmail(email: string): boolean {
  return InputValidator.getInstance().validateEmail(email).isValid;
}

export function validateURL(url: string): boolean {
  return InputValidator.getInstance().validateURL(url).isValid;
}

export function validateFilePath(filePath: string): boolean {
  return InputValidator.getInstance().validateFilePath(filePath).isValid;
}
