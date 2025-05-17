
/**
 * Helper function to retrieve stored user roles from localStorage
 */
export const getStoredUserRoles = (): Record<string, string> => {
  const storedUserRoles = localStorage.getItem('userRoles');
  return storedUserRoles ? JSON.parse(storedUserRoles) : {};
};

/**
 * Helper function to store a user's role in localStorage
 */
export const storeUserRole = (email: string, role: string): void => {
  const userRolesMap = getStoredUserRoles();
  userRolesMap[email] = role;
  localStorage.setItem('userRoles', JSON.stringify(userRolesMap));
  localStorage.setItem('userRole', role);
};

/**
 * Helper function to get the default role from localStorage or fallback
 */
export const getDefaultRole = (): string => {
  return localStorage.getItem('selectedRole') || 'renter';
};
