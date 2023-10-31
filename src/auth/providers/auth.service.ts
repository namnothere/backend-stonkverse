import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BaseApiResponse } from '../../shared/dtos';
import {
  AuthTokenOutput,
  RegisterInput,
  RegisterOutput,
  UserAccessTokenClaims,
} from '../dtos';
import { ILike, Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { MESSAGES, RESULT_STATUS } from '../../shared/constants';
import { User } from '../../user/entities';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hash, compare } from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUsernamePassword(
    username: string,
    pass: string,
  ): Promise<UserAccessTokenClaims> {
    const user = await this.userRepo.findOne({
      where: [{ username: ILike(username) }],
    });
    if (!user) {
      throw new ForbiddenException({
        statusCode: 403,
        message: MESSAGES.USER_NOT_FOUND,
      });
    }
    const match = await compare(pass, user.password);
    if (!match) {
      throw new ForbiddenException({
        statusCode: 403,
        message: MESSAGES.LOGIN_INCORRECT,
      });
    }

    return plainToClass(UserAccessTokenClaims, user, {
      excludeExtraneousValues: true,
    });
  }

  async login(userId: string): Promise<BaseApiResponse<AuthTokenOutput>> {
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) throw new UnauthorizedException();

    const subject = { sub: user.id };
    const payload = {
      username: user.username,
      sub: user.id,
    };

    const authToken = {
      refreshToken: this.jwtService.sign(subject, {
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
      token: this.jwtService.sign(
        { ...payload, ...subject },
        { expiresIn: this.configService.get('jwt.expiresIn') },
      ),
      user: user,
    };

    await this.userRepo.update({ id: userId }, { token: authToken.token });

    const output = plainToClass(
      AuthTokenOutput,
      {
        ...authToken,
        user: user,
      },
      { excludeExtraneousValues: true },
    );
    return {
      status: RESULT_STATUS.SUCCEED,
      error: false,
      data: output,
      code: 0,
      message: MESSAGES.OK,
    };
  }

  async logout(userId: string): Promise<BaseApiResponse<null>> {
    await this.userRepo.update(userId, {
      token() {
        return 'null';
      },
    });
    return {
      status: RESULT_STATUS.SUCCEED,
      data: null,
      message: MESSAGES.OK,
    };
  }

  async registerUser(input: RegisterInput): Promise<BaseApiResponse<any>> {
    const findUserName = await this.userRepo.findOne({
      where: { username: input.username },
    });
    if (findUserName) {
      throw new ForbiddenException(MESSAGES.USERNAME_ALREADY_EXIST);
    }

    const user = new User({
      ...input,
      // role: role,
      // password: await bcrypt.hash(input.password, 10),
      password: await hash(input.password, 10),
      // verification_code: makeId(6),
      // verification_time: Date.now() + convertMilliseconds(VERIFICATION_TIME),
    });
    await this.userRepo.save(user);

    const output = plainToClass(RegisterOutput, user, {
      excludeExtraneousValues: true,
    });

    return {
      status: RESULT_STATUS.SUCCEED,
      error: false,
      data: output,
      code: 0,
      message: MESSAGES.OK,
    };
  }
}
