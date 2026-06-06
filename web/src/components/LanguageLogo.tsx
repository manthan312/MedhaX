import React from 'react';

interface LanguageLogoProps {
  language: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const LanguageLogo: React.FC<LanguageLogoProps> = ({
  language,
  size = 24, // Sized smaller by default
  className = '',
  style = {},
}) => {
  const norm = language.toLowerCase().trim();

  let src = '';
  let alt = language;

  if (norm.includes('python')) {
    src = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg';
  } else if (norm.includes('javascript') || norm === 'js') {
    src = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg';
  } else if (norm.includes('java')) {
    src = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg';
  } else if (norm.includes('c++') || norm.includes('cpp')) {
    src = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg';
  } else if (norm === 'c') {
    src = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg';
  } else if (norm.includes('dbms') || norm.includes('database') || norm.includes('sql')) {
    src = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg';
  } else if (norm.includes('dsa') || norm.includes('algo') || norm.includes('structure')) {
    src = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/neo4j/neo4j-original.svg';
  } else {
    // Operating System
    src = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg';
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
};

export default LanguageLogo;
