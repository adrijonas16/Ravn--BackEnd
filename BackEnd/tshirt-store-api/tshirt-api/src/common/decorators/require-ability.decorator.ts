import { SetMetadata } from '@nestjs/common';
import type { Actions, Subjects } from '../../casl/casl-ability.factory';

export const REQUIRED_ABILITY_KEY = 'requiredAbility';

export interface RequiredAbility {
  action: Actions;
  subject: Subjects;
}

export const RequireAbility = (action: Actions, subject: Subjects) =>
  SetMetadata(REQUIRED_ABILITY_KEY, { action, subject });
