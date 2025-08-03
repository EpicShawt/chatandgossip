const ChatManager = require('../services/ChatManager');

describe('ChatManager', () => {
  let chatManager;

  beforeEach(() => {
    chatManager = new ChatManager();
  });

  describe('User Management', () => {
    it('should add a new user', () => {
      const userData = {
        username: 'testuser',
        gender: 'male'
      };
      
      const user = chatManager.addUser('socket123', userData);
      
      expect(user).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.gender).toBe('male');
      expect(user.isOnline).toBe(true);
      expect(user.socketId).toBe('socket123');
    });

    it('should remove a user', () => {
      const userData = { username: 'testuser' };
      const user = chatManager.addUser('socket123', userData);
      
      chatManager.removeUser('socket123');
      
      const removedUser = chatManager.users.get(user.id);
      expect(removedUser.isOnline).toBe(false);
    });

    it('should generate unique ID for user without ID', () => {
      const userData = { username: 'testuser' };
      const user = chatManager.addUser('socket123', userData);
      
      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe('string');
    });
  });

  describe('Partner Finding', () => {
    it('should find a partner for waiting user', () => {
      const user1 = chatManager.addUser('socket1', { username: 'user1', gender: 'male' });
      const user2 = chatManager.addUser('socket2', { username: 'user2', gender: 'female' });
      
      chatManager.addToWaitingList(user1.id);
      chatManager.addToWaitingList(user2.id);
      
      const partner = chatManager.findPartner(user1.id);
      expect(partner).toBeDefined();
      expect(partner.id).toBe(user2.id);
    });

    it('should not find partner for non-existent user', () => {
      const partner = chatManager.findPartner('non-existent-id');
      expect(partner).toBeNull();
    });

    it('should pair with test user when no real users available', () => {
      const user = chatManager.addUser('socket1', { username: 'user1', gender: 'male' });
      chatManager.addToWaitingList(user.id);
      
      const partner = chatManager.findPartner(user.id);
      expect(partner).toBeDefined();
      expect(partner.isTestUser).toBe(true);
    });
  });

  describe('Chat Pairing', () => {
    it('should pair two users', () => {
      const user1 = chatManager.addUser('socket1', { username: 'user1' });
      const user2 = chatManager.addUser('socket2', { username: 'user2' });
      
      const pairId = chatManager.pairUsers(user1, user2);
      
      expect(pairId).toBeDefined();
      expect(typeof pairId).toBe('string');
      
      // Check that the pair was actually created
      const pair = chatManager.findChatPair(user1.id, user2.id);
      expect(pair).toBeDefined();
      expect(pair.user1).toBe(user1.id);
      expect(pair.user2).toBe(user2.id);
      expect(pair.createdAt).toBeDefined();
    });

    it('should find existing chat pair', () => {
      const user1 = chatManager.addUser('socket1', { username: 'user1' });
      const user2 = chatManager.addUser('socket2', { username: 'user2' });
      
      const pairId = chatManager.pairUsers(user1, user2);
      const foundPair = chatManager.findChatPair(user1.id, user2.id);
      
      expect(foundPair).toBeDefined();
      expect(foundPair.id).toBe(pairId);
    });
  });

  describe('Waiting List Management', () => {
    it('should add user to waiting list', () => {
      const user = chatManager.addUser('socket1', { username: 'user1' });
      
      chatManager.addToWaitingList(user.id);
      
      expect(chatManager.isUserWaiting(user.id)).toBe(true);
    });

    it('should remove user from waiting list', () => {
      const user = chatManager.addUser('socket1', { username: 'user1' });
      
      chatManager.addToWaitingList(user.id);
      chatManager.removeFromWaitingList(user.id);
      
      expect(chatManager.isUserWaiting(user.id)).toBe(false);
    });

    it('should add user to waiting list with gender filter', () => {
      const user = chatManager.addUser('socket1', { username: 'user1', gender: 'male' });
      
      chatManager.addToWaitingList(user.id, 'female');
      
      const waitingUser = chatManager.waitingUsers.get(user.id);
      expect(waitingUser.genderFilter).toBe('female');
    });
  });

  describe('Statistics', () => {
    it('should return correct stats', () => {
      const user1 = chatManager.addUser('socket1', { username: 'user1' });
      const user2 = chatManager.addUser('socket2', { username: 'user2' });
      
      chatManager.addToWaitingList(user1.id);
      chatManager.pairUsers(user1, user2);
      
      const stats = chatManager.getStats();
      
      expect(stats.totalUsers).toBe(3); // Including test user
      expect(stats.onlineUsers).toBe(3); // Including test user who is online
      expect(stats.waitingUsers).toBe(0); // User1 was removed from waiting list when paired
      expect(stats.activeChats).toBe(1);
    });

    it('should return online users', () => {
      const user1 = chatManager.addUser('socket1', { username: 'user1' });
      const user2 = chatManager.addUser('socket2', { username: 'user2' });
      
      const onlineUsers = chatManager.getOnlineUsers();
      
      expect(onlineUsers.length).toBe(2);
      expect(onlineUsers.some(u => u.id === user1.id)).toBe(true);
      expect(onlineUsers.some(u => u.id === user2.id)).toBe(true);
      // Test user should be excluded from online users list
      expect(onlineUsers.some(u => u.isTestUser)).toBe(false);
    });
  });

  describe('Test User', () => {
    it('should have test user available', () => {
      expect(chatManager.testUser).toBeDefined();
      expect(chatManager.testUser.username).toBe('Sarah');
      expect(chatManager.testUser.isTestUser).toBe(true);
    });

    it('should generate test user reply', () => {
      const reply = chatManager.getTestUserReply('Hello');
      
      expect(reply).toBeDefined();
      expect(typeof reply).toBe('string');
      expect(reply.length).toBeGreaterThan(0);
    });
  });
}); 