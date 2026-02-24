import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local'){
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // console.log('1. LocalAuthGuard running', context);
    // console.log('body', context.getArgs());
    const result = (await super.canActivate(context)) as boolean;
    //** "result" is user data. But in here we need to boolean value that represent the user has existed */
    // console.log('6. LocalAuthGuard result after run local.strategy', result);
    return result;
  }
}
