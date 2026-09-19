import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Ip,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResponseHelper } from '../common/response.helper';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    const result = await this.authService.login(loginDto, ip);
    return ResponseHelper.success('Login successful', result);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Ip() ip: string) {
    const result = await this.authService.register(registerDto, ip);
    return ResponseHelper.success('Registration successful', result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.authService.getProfile(user.id);
    return ResponseHelper.success('User profile retrieved', profile);
  }
}
