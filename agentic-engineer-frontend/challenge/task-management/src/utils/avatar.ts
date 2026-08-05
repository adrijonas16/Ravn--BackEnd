// Returns the user's avatar URL, or a placeholder based on their name initials
export function getAvatarUrl(avatar: string | null | undefined, fullName: string): string {
  if (avatar) return avatar;
  // Use DiceBear API to generate an avatar from initials
  const initials = fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toLowerCase();
  return `https://api.dicebear.com/7.x/initials/svg?seed=${initials}`;
}
