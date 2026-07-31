import { TaskTag } from '../types/task';

// Convert a tag enum value into its display label (e.g. "ANDROID" -> "Android")
export function getTagLabel(tag: typeof TaskTag[keyof typeof TaskTag]): string {
  const map: Record<string, string> = {
    [TaskTag.ANDROID]: 'Android',
    [TaskTag.IOS]: 'IOS APP',
    [TaskTag.NODE_JS]: 'Node.js',
    [TaskTag.RAILS]: 'Rails',
    [TaskTag.REACT]: 'React',
  };
  return map[tag];
}

// Convert a tag enum value into a CSS-safe class suffix (e.g. "NODE_JS" -> "nodejs")
export function getTagClassName(tag: typeof TaskTag[keyof typeof TaskTag]): string {
  const map: Record<string, string> = {
    [TaskTag.ANDROID]: 'android',
    [TaskTag.IOS]: 'ios',
    [TaskTag.NODE_JS]: 'nodejs',
    [TaskTag.RAILS]: 'rails',
    [TaskTag.REACT]: 'react',
  };
  return map[tag];
}
