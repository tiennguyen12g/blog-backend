import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { CustomException } from '../global/custom-exception.error';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
     super({ usernameField: 'email', session: false, passReqToCallback: true }); // Change the username field to 'email'
  }

  async validate(req: Request, email: string, password: string): Promise<any> {
    /**
     * email and password receive from super.
     */
    // console.log('2. LocalStrategy validate', email);
    
    const user = await this.authService.validateUser_By_Password({email: email, password:password});
    if (!user) {
      // throw new UnauthorizedException();
      // throw new Error('Login failed. Email or password is incorrect.');
      throw new CustomException({
        statusCode: 401,
        status: "Failed",
        message: 'Login failed. Email or password is incorrect.',
      });
    }
    // console.log('5. user data', user);
    return user;
  }
}
