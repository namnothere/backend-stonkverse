import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

// import { MailService } from '../../shared/mail';
import { User } from '../entities';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    // private mailService: MailService,
    @InjectModel(User.name)
    private userRepo: Model<User>,
  ) {}

  // public async validateUser(username: string, password: string): Promise<UserAccessTokenClaims> {
  //   const user = await this.userRepo.findOne({ where: [{ username }, { email: username }] });

  //   if (!user) {
  //     throw new ForbiddenException({
  //       statusCode: 403,
  //       message: MESSAGES.USER_NOT_FOUND,
  //     });
  //   }

  //   const match = await compare(password, user.password);
  //   if (!match) {
  //     throw new ForbiddenException({
  //       statusCode: 403,
  //       message: MESSAGES.LOGIN_INCORRECT,
  //     });
  //   }

  //   return plainToClass(UserAccessTokenClaims, user, {
  //     excludeExtraneousValues: true,
  //   });
  // }

  // public getPayload(token: string): Payload | null {
  //   try {
  //     const payload = this.jwtService.decode<JwtPayload | null>(token);
  //     if (!payload) {
  //       return null;
  //     }

  //     return { userId: payload.sub, username: payload.username, role: payload.role };
  //   } catch {
  //     // Unexpected token i in JSON at position XX
  //     return null;
  //   }
  // }

  // private getRefreshToken(sub: string): string {
  //   return this.jwtService.sign(
  //     { sub },
  //     {
  //       secret: this.configService.get('jwtRefreshSecret'),
  //       expiresIn: '7d', // Set greater than the expiresIn of the access_token
  //     },
  //   );
  // }

  // async validateUsernamePassword(username: string, pass: string): Promise<UserAccessTokenClaims> {
  //   const user = await this.userRepo.findOne({
  //     where: [{ username: ILike(username) }],
  //   });
  //   if (!user) {
  //     throw new ForbiddenException({
  //       statusCode: 403,
  //       message: MESSAGES.USER_NOT_FOUND,
  //     });
  //   }
  //   const match = await compare(pass, user.password);
  //   if (!match) {
  //     throw new ForbiddenException({
  //       statusCode: 403,
  //       message: MESSAGES.LOGIN_INCORRECT,
  //     });
  //   }

  //   return plainToClass(UserAccessTokenClaims, user, {
  //     excludeExtraneousValues: true,
  //   });
  // }

  // async login(userId: string): Promise<BaseApiResponse<AuthTokenOutput>> {
  //   const user = await this.userRepo.findOne({
  //     where: {
  //       id: userId,
  //     },
  //   });

  //   if (!user) throw new UnauthorizedException();
  //   if (!user.isVerified) throw new UnauthorizedException(MESSAGES.USER_NOT_VERIFIED);

  //   const subject = { sub: user.id };
  //   const payload = {
  //     username: user.username,
  //     sub: user.id,
  //     role: user.role,
  //   };

  //   const authToken = {
  //     refreshToken: this.jwtService.sign(subject, {
  //       expiresIn: this.configService.get('refreshExpiresIn'),
  //     }),
  //     accessToken: this.jwtService.sign({ ...payload, ...subject }, { expiresIn: this.configService.get('expiresIn') }),
  //     user,
  //   };

  //   await this.userRepo.update({ id: userId }, { token: authToken.accessToken });

  //   const output = plainToClass(
  //     AuthTokenOutput,
  //     {
  //       ...authToken,
  //       user,
  //     },
  //     { excludeExtraneousValues: true },
  //   );
  //   return {
  //     status: RESULT_STATUS.SUCCEED,
  //     error: false,
  //     data: output,
  //     code: 0,
  //     message: MESSAGES.OK,
  //   };
  // }

  // async logout(userId: string): Promise<BaseApiResponse<null>> {
  //   await this.userRepo.update(userId, {
  //     token() {
  //       return 'null';
  //     },
  //   });
  //   return {
  //     status: RESULT_STATUS.SUCCEED,
  //     data: null,
  //     message: MESSAGES.OK,
  //   };
  // }

  // async registerUser(input: RegisterInput): Promise<BaseApiResponse<RegisterOutput>> {
  //   const findUserName = await this.userRepo.findOne({
  //     where: [{ username: input.username }, { email: input.email }],
  //   });
  //   if (findUserName) {
  //     throw new ForbiddenException(MESSAGES.USERNAME_ALREADY_EXIST);
  //   }

  //   const user = new User({
  //     ...input,
  //     // role: role,
  //     // password: await bcrypt.hash(input.password, 10),
  //     password: await hash(input.password, 10),
  //     activationCode: makeId(6),
  //     // verification_time: Date.now() + convertMilliseconds(VERIFICATION_TIME),
  //   });
  //   const newuser = this.userRepo.create(user);

  //   const promises = [this.userRepo.save(newuser), this.mailService.sendUserConfirmation(newuser, newuser.activationCode)];

  //   await Promise.all(promises);

  //   const output = plainToClass(RegisterOutput, newuser, {
  //     excludeExtraneousValues: true,
  //   });

  //   return {
  //     status: RESULT_STATUS.SUCCEED,
  //     error: false,
  //     data: output,
  //     code: 0,
  //     message: MESSAGES.OK,
  //   };
  // }

  // async activateUser(input: ActivateInput): Promise<BaseApiResponse<null>> {
  //   const user = await this.userRepo.findOne({
  //     where: [{ username: input.username }, { email: input.username }],
  //   });
  //   if (!user) {
  //     throw new ForbiddenException(MESSAGES.USER_NOT_FOUND);
  //   }

  //   if (user.isVerified) {
  //     throw new BadRequestException(MESSAGES.USER_ALREADY_VERIFIED);
  //   }

  //   if (user.activationCode !== input.code) {
  //     throw new ForbiddenException(MESSAGES.ACTIVATION_CODE_INCORRECT);
  //   }

  //   await this.userRepo.update({ id: user.id }, { isVerified: true });
  //   return {
  //     status: RESULT_STATUS.SUCCEED,
  //     data: null,
  //     message: MESSAGES.OK,
  //   };
  // }

  // public validateRefreshToken(userId: string, refreshToken: string): boolean {
  //   if (!this.jwtService.verify(refreshToken, { secret: this.configService.get('refreshSecretKey') })) {
  //     return false;
  //   }

  //   const payload = this.jwtService.decode<{ sub: string }>(refreshToken);
  //   return payload.sub === userId;
  // }

  // public jwtSign(data: UserAccessTokenClaims): JwtSign {
  //   const payload: JwtPayload = { sub: data.id, username: data.username, role: data.role };

  //   return {
  //     access_token: this.jwtService.sign(payload),
  //     refresh_token: this.getRefreshToken(payload.sub),
  //   };
  // }

  // async resendUserConfirmation(email: string): Promise<BaseApiResponse<null>> {
  //   const user = await this.userRepo.findOne({
  //     where: {
  //       email,
  //     },
  //   });

  //   if (!user) {
  //     throw new ForbiddenException(MESSAGES.USER_NOT_FOUND);
  //   }

  //   if (user.isVerified) {
  //     throw new BadRequestException(MESSAGES.USER_ALREADY_VERIFIED);
  //   }

  //   await this.mailService.sendUserConfirmation(user, user.activationCode);
  //   return {
  //     status: RESULT_STATUS.SUCCEED,
  //     data: null,
  //     message: MESSAGES.OK,
  //   };
  // }
}
