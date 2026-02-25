import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { UserModule } from '../modules/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RestrictedGuard } from './restricted.guard';
import { RolesGuard } from './roles.guard';
import { Auth2FAModule } from './2fa/2fa.module';
import { EmailModule } from '../modules/email/email.module';
import { GoogleStrategy } from './google.strategy';
import { GoogleTokenVerifyService } from './google-token-verify.service';

@Module({
  imports: [
    UserModule,
    PassportModule,
    Auth2FAModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '300s' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    GoogleTokenVerifyService,
    RestrictedGuard,
    RolesGuard,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
  controllers: [AuthController],
  exports: [AuthService, UserModule, RestrictedGuard, RolesGuard], // Export guards and UserModule
})
export class AuthModule {}

