import { createUser, getAllUsers, getUserById } from '../../services/userService';
import pool from '../../config/database';
import { hashPassword } from '../../utils/password';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../utils/password');

const mockQuery = jest.fn();
(pool as any).query = mockQuery;
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'supplier' as const,
      };

      const mockHashedPassword = 'hashed_password_123';
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      const mockCreatedAt = new Date();
      const mockUpdatedAt = new Date();

      // Mock email uniqueness check (no existing user)
      mockQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      // Mock password hashing
      mockHashPassword.mockResolvedValueOnce(mockHashedPassword);

      // Mock user insertion
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: mockUserId,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            created_at: mockCreatedAt,
            updated_at: mockUpdatedAt,
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await createUser(userData);

      expect(result).toEqual({
        id: mockUserId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
      });

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockHashPassword).toHaveBeenCalledWith(userData.password);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'supplier' as const,
      };

      // Mock email uniqueness check (existing user found)
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'existing-user-id' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      await expect(createUser(userData)).rejects.toThrow('Email already registered');

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockHashPassword).not.toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('should retrieve all users', async () => {
      const mockUsers = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user1@example.com',
          name: 'User One',
          role: 'supplier',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          email: 'user2@example.com',
          name: 'User Two',
          role: 'agency',
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02'),
        },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockUsers,
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      const result = await getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockUsers[0].id,
        email: mockUsers[0].email,
        name: mockUsers[0].name,
        role: mockUsers[0].role,
        createdAt: mockUsers[0].created_at,
        updatedAt: mockUsers[0].updated_at,
      });
      expect(result[1]).toEqual({
        id: mockUsers[1].id,
        email: mockUsers[1].email,
        name: mockUsers[1].name,
        role: mockUsers[1].role,
        createdAt: mockUsers[1].created_at,
        updatedAt: mockUsers[1].updated_at,
      });
    });

    it('should return empty array when no users exist', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('getUserById', () => {
    it('should retrieve user by ID', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        name: 'Test User',
        role: 'supplier',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await getUserById(mockUser.id);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: mockUser.created_at,
        updatedAt: mockUser.updated_at,
      });
    });

    it('should throw error when user not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await expect(getUserById('non-existent-id')).rejects.toThrow('User not found');
    });
  });
});
