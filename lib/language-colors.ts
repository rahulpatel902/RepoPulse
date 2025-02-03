// Common programming language colors based on GitHub's language colors
const languageColors: { [key: string]: string } = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  React: '#61dafb',
  Scala: '#c22d40',
  Perl: '#0298c3',
  Lua: '#000080',
  R: '#198CE7',
  MATLAB: '#e16737',
  Assembly: '#6E4C13',
};

export function getLanguageColor(language: string): string {
  // Normalize the language name by converting to lowercase for case-insensitive comparison
  const normalizedLanguage = language.toLowerCase();
  
  // Find a matching language (case-insensitive)
  const matchedLanguage = Object.keys(languageColors).find(
    key => key.toLowerCase() === normalizedLanguage
  );
  
  // Return the color if found, otherwise return a default color
  return matchedLanguage ? languageColors[matchedLanguage] : '#6e7681';
}
