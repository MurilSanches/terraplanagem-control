import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';

const mockRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof mockRepo>;
  let refreshTokenRepo: ReturnType<typeof mockRepo>;

  const HASH = bcrypt.hashSync('senha123', 10);
  const MOCK_USER: User = {
    id: 'user-1',
    name: 'Admin',
    email: 'admin@example.com',
    passwordHash: HASH,
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    userRepo = mockRepo();
    refreshTokenRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(RefreshToken), useValue: refreshTokenRepo },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock.jwt.token') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('15m') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('retorna accessToken e dados do usuário com credenciais corretas', async () => {
      userRepo.findOne.mockResolvedValue(MOCK_USER);
      refreshTokenRepo.create.mockReturnValue({});
      refreshTokenRepo.save.mockResolvedValue({});

      const result = await service.login({ email: MOCK_USER.email, password: 'senha123' });

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe(MOCK_USER.email);
      // Não deve expor o hash da senha
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('lança UnauthorizedException com email não encontrado', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'naoexiste@example.com', password: 'qualquer' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException com senha errada', async () => {
      userRepo.findOne.mockResolvedValue(MOCK_USER);

      await expect(
        service.login({ email: MOCK_USER.email, password: 'senha_errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException para usuário inativo', async () => {
      userRepo.findOne.mockResolvedValue(null); // isActive: false retorna null no findOne
      await expect(
        service.login({ email: MOCK_USER.email, password: 'senha123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('revoga o refresh token', async () => {
      refreshTokenRepo.update.mockResolvedValue({ affected: 1 });
      await service.logout('some-refresh-token-value');
      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ tokenHash: expect.any(String) }),
        { revoked: true },
      );
    });
  });
});
