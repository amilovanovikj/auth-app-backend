import { User } from "../entities/User";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { AuthContext } from "src/types";
import { hash, verify } from 'argon2';
import { COOKIE_NAME } from "../constants";

@InputType()
class EmailPasswordInput {
  @Field()
  email: string

  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  
  @Query(() => User, { nullable: true })
  async me(
    @Ctx() { req }: AuthContext
  ) {
    if (!req.session.userId) {
      return null
    }
    const user = await User.findOne({
      id: req.session.userId
    });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') { email, password }: EmailPasswordInput,
    @Ctx() { req }: AuthContext
  ): Promise<UserResponse> {
    let errors = []
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({
        field: "email",
        message: "invalid email address"
      })
    }
    if (password.length < 8) {
      errors.push({
        field: "password",
        message: "invalid password length"
      })
    }
    if (password.search(/[a-z]/i) < 0) {
      errors.push({
        field: "password",
        message: "password must contain at least one letter"
      })
    }
    if (password.search(/[0-9]/) < 0) {
      errors.push({
        field: "password",
        message: "password must contain at least one digit"
      })
    }
    if (errors.length !== 0) {
      return {
        errors
      }
    }

    const hashedPassword = await hash(password);
    const user = User.create({
      email: email,
      password: hashedPassword,
    })
    try {
      await User.save(user)
    } catch(err) {
      if (err.code === "ER_DUP_ENTRY") {
        return {
          errors: [
            {
              field: "email",
              message: "a user with that email address already exists"
            }
          ]
        }
      }
    }
    req.session.userId = user.id
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') { email, password }: EmailPasswordInput,
    @Ctx() { req }: AuthContext
  ): Promise<UserResponse> {
    const user = await User.findOne({ email: email })
    if(!user){
      return {
        errors: [
          {
            field: "email",
            message: "email doesn't exist",
          }
        ]
      }
    };
    
    const valid = await verify(user.password, password);
    if(!valid){
      return {
        errors: [
          {
            field: "password",
            message: "password is incorrect",
          }
        ]
      };
    }

    req.session.userId = user.id   
    
    return { user }
  }

  @Mutation(() => Boolean)
  logout(
    @Ctx() { req, res }: AuthContext
  ) {
    return new Promise(resolve => req.session.destroy(err => {
      res.clearCookie(COOKIE_NAME);
      if (err) {
        console.log(err);
        resolve(false)
        return
      }
      resolve(true)
    }))
  }
}