import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';


/**
 * @Importance to know PassportStrategy
 * 1. validate is default function that we have define when extends PassportStrategy.
 * Because after run super function. Passport will automatic call function "validate". 
 * If you do not define function "validate" the authentication flow does not work properly.
 * 2. Passport call "validate" and pass to it a data from request. 
 * In "validate" function we return all data Passport put to "validate" and return it.
 * The value return in "validate" will go back to JwtAuthGuard.
 * 3. Define the name of strategy.
 * You can define the strategy name here: PassportStrategy(Strategy, 'jwt').
 * If you omit second option <'jwt'>, PassportStrategy will get the name of the file is name of strategy.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => {
        let access_token = null;
        let refresh_token = null;
        if (request && request.cookies) {
          access_token = request.cookies['access_token'];
          
        }
        return access_token;
      }]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY,
    });
  }

  async validate(payload: any,) {
      // You can add additional validation logic here
      // console.log('2.JwtStrategy run validate and get user data parse', payload);
      // return { userId: payload.sub, email: payload.email, role: payload.role };
      // console.log('payload', payload);
      return payload;
  }
}
