import api from './api';

export const userService = {
  searchUsers: async (username: string) => {
    try {
      const response = await api.get(`/users/search?username=${username}`);
      return response.data; // Expected: [{ id, username, ... }]
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },
};
