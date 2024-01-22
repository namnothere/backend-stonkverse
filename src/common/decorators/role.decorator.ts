import { SetMetadata } from '@nestjs/common';
import { Role } from '../../user/entities';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
