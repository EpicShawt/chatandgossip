const mongoose = require('mongoose');
const User = require('../models/User');

// Mock the database connection for testing
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('User Model Test', () => {
  it('should create a user with valid data', async () => {
    const validUser = new User({
      uniqueId: 'ABC123',
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      gender: 'male'
    });

    const savedUser = await validUser.save();
    expect(savedUser._id).toBeDefined();
    expect(savedUser.username).toBe(validUser.username);
    expect(savedUser.email).toBe(validUser.email);
    expect(savedUser.uniqueId).toBe(validUser.uniqueId);
  });

  it('should fail to create user without required fields', async () => {
    const userWithoutRequiredField = new User({
      username: 'testuser'
      // missing uniqueId
    });

    let err;
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
  });

  it('should create anonymous user without email and password', async () => {
    const anonymousUser = new User({
      uniqueId: 'XYZ789',
      username: 'anonymous_user',
      isAnonymous: true
    });

    const savedUser = await anonymousUser.save();
    expect(savedUser.isAnonymous).toBe(true);
    expect(savedUser.email).toBeUndefined();
    expect(savedUser.password).toBeUndefined();
  });

  it('should set default values correctly', async () => {
    const user = new User({
      uniqueId: 'DEF456',
      username: 'defaultuser'
    });

    const savedUser = await user.save();
    expect(savedUser.isOnline).toBe(false);
    expect(savedUser.isAnonymous).toBe(true);
    expect(savedUser.isTestUser).toBe(false);
    expect(savedUser.gender).toBe('not_disclosed');
  });

  it('should update updatedAt timestamp on save', async () => {
    const user = new User({
      uniqueId: 'GHI789',
      username: 'timestampuser'
    });

    const savedUser = await user.save();
    const originalUpdatedAt = savedUser.updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    savedUser.username = 'updateduser';
    const updatedUser = await savedUser.save();

    expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
}); 