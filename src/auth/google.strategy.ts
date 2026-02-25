import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    // Construct absolute callback URL for production
    const callbackPath = configService.get<string>('GOOGLE_CALLBACK_URL') || '/api/v1/auth/google/callback';
    const frontendUrl = configService.get<string>('FRONTEND_URL') || 'https://australiastorys.com';
    
    // If callbackPath is already absolute, use it; otherwise construct from frontend URL
    let callbackURL: string;
    if (callbackPath.startsWith('http://') || callbackPath.startsWith('https://')) {
      callbackURL = callbackPath;
    } else {
      // For production, use the production domain; for dev, use localhost
      const isProduction = process.env.NODE_ENV === 'production' || frontendUrl.includes('australiastorys.com');
      if (isProduction) {
        callbackURL = `https://australiastorys.com${callbackPath}`;
      } else {
        callbackURL = `https://localhost:443${callbackPath}`;
      }
    }
    
    console.log('🔵 [GoogleStrategy] Initializing with callback URL:', callbackURL);
    
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
      provider: 'google',
    };
    done(null, user);
  }
}
