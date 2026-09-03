import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../../casl/casl-ability.factory';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import {
  REQUIRED_ABILITY_KEY,
  RequiredAbility,
} from '../decorators/require-ability.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAbility = this.reflector.getAllAndOverride<RequiredAbility>(
      REQUIRED_ABILITY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAbility) return true;

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    if (!request.user) {
      throw new ForbiddenException('Missing authenticated user');
    }

    const ability = this.caslAbilityFactory.createForUser(request.user);
    if (!ability.can(requiredAbility.action, requiredAbility.subject)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
