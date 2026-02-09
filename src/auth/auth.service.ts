import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { validateUserPassword } from '../utils/bcryptPassword';
import { User_Login_Type, User_Type } from '../modules/user/user.interface';
import { UserMongoService } from '../modules/user/services/user-mongo.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private userMongoService: UserMongoService,
  ) {}

  async generateAccessToken(payload: any) {
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  async generateRefreshToken(payload: any) {
    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  async validateUser(bodyData: User_Login_Type): Promise<any> {
    const userData = await this.userMongoService.mongo_loginUser(bodyData);
    console.log('userData', userData);
    return userData;
  }

  async validateUser_By_Password({ email, password }: { email: string; password: string }): Promise<any> {
    const user = await this.userMongoService.findByEmail(email);
    if (!user) return null;

    const userObj = user.toObject();
    
    // Check if user is banned (cannot login)
    if (userObj.isBan === 'banned') {
      throw new UnauthorizedException('Your account has been banned. You cannot login.');
    }

    const isPasswordMatch = await validateUserPassword({ password: password, hash: userObj.password });
    
    if (isPasswordMatch) {
      const { password: _, ...result } = userObj;
      return result;
    } else {
      return null;
    }
  }

  async validateUser_By_ThirdParty(bodyData: User_Login_Type): Promise<any> {
    // Third-party authentication (Google, etc.) can be implemented here
    // For now, this is a placeholder for future implementation
    throw new UnauthorizedException('Third-party authentication not implemented in template');
  }

  async verifyAccessToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.configService.get<string>('JWT_SECRET_KEY'));
      return decoded; // Return decoded payload if token is valid
    } catch (err) {
      throw new UnauthorizedException('Invalid token'); // Throw exception if token is invalid
    }
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      user_id: user._id || user.user_id, 
      role: user.role || 'user' 
    };
    return {
      access_token: await this.generateAccessToken(payload),
      refresh_token: await this.generateRefreshToken(payload),
    };
  }

  async refreshTokens(email: string, refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userMongoService.findByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }
      const userObj = user.toObject();
      const { password: _, ...userWithoutPassword } = userObj;
      return this.login(userWithoutPassword);
    } catch (e) {
      throw new Error('Invalid refresh token');
    }
  }
  async refreshToken(refreshToken: string) {
    const user = this.jwtService.verify(refreshToken);
    if (!user) throw new UnauthorizedException();
    const payload = {
      email: user.email,
      user_id: user.user_id || user._id,
      role: user.role || 'user',
    };
    const access_token = await this.generateAccessToken(payload);
    const new_refresh_token = await this.generateRefreshToken(payload);
    return { access_token, refresh_token: new_refresh_token };
  }

  // Wallet functionality removed from template - can be added as needed
}
