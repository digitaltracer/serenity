import React from 'react';

interface ProjectIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  alt?: string;
}

export const ProjectIcon: React.FC<ProjectIconProps> = ({
  size = 'md',
  className = '',
  alt = 'Project'
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };

  const iconSize = typeof size === 'number' ? size : sizeMap[size];

  return (
    <div
      className={`project-icon project-icon-${typeof size === 'string' ? size : 'md'} ${className}`}
      style={{
        width: iconSize,
        height: iconSize,
      }}
      role="img"
      aria-label={alt}
    />
  );
};

// Usage examples:
// <ProjectIcon size="sm" />
// <ProjectIcon size={20} className="my-custom-class" />
// <ProjectIcon size="lg" alt="My Project" />
