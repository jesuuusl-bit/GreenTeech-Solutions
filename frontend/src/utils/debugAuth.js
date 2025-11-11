// Debug utility for authentication issues
export const debugAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('🔍 Auth Debug Information:');
  console.log('Token exists:', !!token);
  console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'null');
  console.log('User exists:', !!user);
  
  if (user) {
    try {
      const parsedUser = JSON.parse(user);
      console.log('User data:', parsedUser);
    } catch (e) {
      console.log('User data (invalid JSON):', user);
    }
  }
  
  console.log('Current URL:', window.location.href);
  console.log('Current path:', window.location.pathname);
  
  return { token: !!token, user: !!user };
};

// Call this from console: debugAuth()
window.debugAuth = debugAuth;