import { Body, Controller, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly jwt: JwtService) {}

  @Post('register')
  async register(@Body(new ZodValidationPipe(registerSchema)) body: z.infer<typeof registerSchema>) {
    const passwordHash = await bcrypt.hash(body.password, 10);
    // TODO: persist user in DB
    const token = await this.jwt.signAsync({ sub: 'user-id-stub', email: body.email, role: 'owner' });
    return { access_token: token };
  }

  @Post('login')
  async login(@Body(new ZodValidationPipe(loginSchema)) body: z.infer<typeof loginSchema>) {
    // TODO: fetch user and verify password
    const token = await this.jwt.signAsync({ sub: 'user-id-stub', email: body.email, role: 'owner' });
    return { access_token: token };
  }
}
