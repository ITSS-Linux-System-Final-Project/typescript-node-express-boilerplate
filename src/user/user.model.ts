import {
  getModelForClass,
  modelOptions,
  plugin,
  prop,
  DocumentType,
} from '@typegoose/typegoose';
import mongooseUniqueValidator from 'mongoose-unique-validator';
import { UserStatus } from './enums/user-status.enum';
import { UserType } from './enums/user-type.enum';

export const StatusList = [0, 1, 2] as const;

@modelOptions({
  schemaOptions: {
    discriminatorKey: 'type',
  },
})
@plugin(mongooseUniqueValidator)
export class User {
  @prop()
  fullname: string;

  @prop()
  description: string;

  @prop({ required: true, unique: true })
  email: string;

  @prop({ required: true })
  phone: string;

  @prop()
  avatar: string;

  @prop({ required: true, select: false })
  hashed_password?: string;

  @prop()
  birthday: Date;

  @prop()
  address: string;

  @prop({ default:UserType.DEFAULT_USER_TYPE, enum: UserType })
  type?: UserType;

  @prop({ required: true, enum: UserStatus })
  status: UserStatus;

  @prop({ required: true })
  del_flag: boolean;

  @prop({ required: true })
  create_time: Date;

  @prop({ required: true })
  active_token: string;
}
export type UserDocument = DocumentType<User>;
export const UserModel = getModelForClass(User);
