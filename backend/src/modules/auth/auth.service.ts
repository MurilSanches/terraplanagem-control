import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokensRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email, isActive: true },
    });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas');

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return { accessToken, refreshToken, user: this.sanitize(user) };
  }

  async refresh(tokenValue: string) {
    const hash = this.hashToken(tokenValue);
    const record = await this.refreshTokensRepo.findOne({
      where: { tokenHash: hash, revoked: false },
      relations: ['user'],
    });

    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    // Rotate: revoke old, issue new
    record.revoked = true;
    await this.refreshTokensRepo.save(record);

    const accessToken = this.generateAccessToken(record.user);
    const newRefreshToken = await this.generateRefreshToken(record.user);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(tokenValue: string) {
    const hash = this.hashToken(tokenValue);
    await this.refreshTokensRepo.update({ tokenHash: hash }, { revoked: true });
  }

  private generateAccessToken(user: User) {
    return this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: this.config.get('JWT_ACCESS_EXPIRY') || '15m' },
    );
  }

  private async generateRefreshToken(user: User) {
    const tokenValue = crypto.randomBytes(40).toString('hex');
    const hash = this.hashToken(tokenValue);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const record = this.refreshTokensRepo.create({
      userId: user.id,
      tokenHash: hash,
      expiresAt,
    });
    await this.refreshTokensRepo.save(record);
    return tokenValue;
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private sanitize(user: User) {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }
}
