import { gqlCall } from "../src/test-utils/gqlCall";
import { testConn } from "../src/test-utils/testConn";
import { Request, Response } from 'express';
import { Session, SessionData } from 'express-session';
import { Connection } from "typeorm";
import { User } from "../src/entities/User";
import { hash } from "argon2";

let conn: Connection;
beforeAll(async () => {
  conn = await testConn();
})
afterAll(async () => {
  await conn.close()
})

const loginMutation = `mutation Login($options: EmailPasswordInput!) {
  login(options: $options) {
    errors {
      field,
      message
    }
    user {
      id,
      email,
    }
  }
}`

let req = {
  session: {
    userId: -1
  }
} as Request & {
  session: Session & Partial<SessionData> & { userId?: number };
} 

let res = {} as Response

describe('login', () => {
  it("should log in user when email and password are OK", async () => {
    const user = {
      email: "login_user@domain.xyz",
      password: "loginP4ssw0rd"
    }
    const hashedPassword = await hash(user.password);
    const dbUser = await User.create({
      email: user.email,
      password: hashedPassword
    }).save()

    await gqlCall({
      source: loginMutation,
      variableValues: {
        options: user
      },
      context: { req, res }
    })

    expect(req.session.userId).toEqual(dbUser.id)
  });
  
  it("should not log in user when email doesn't exist", async () => {
    const user = {
      email: "non_existing_user@domain.xyz",
      password: "nonExistingP4ssw0rd"
    }

    const response = await gqlCall({
      source: loginMutation,
      variableValues: {
        options: user
      },
      context: { req, res }
    })

    expect(response).toMatchObject({
      data: {
        login: {
          errors: [
            {
              field: "email",
              message: "email doesn't exist"
            }
          ],
          user: null
        }
      }
    })
  });
  
  it("should not log in user when password is incorrect", async () => {
    const user = {
      email: "login_user@domain.xyz",
      password: "wrongP4ssw0rd"
    }

    const response = await gqlCall({
      source: loginMutation,
      variableValues: {
        options: user
      },
      context: { req, res }
    })

    expect(response).toMatchObject({
      data: {
        login: {
          errors: [
            {
              field: "password",
              message: "password is incorrect"
            }
          ],
          user: null
        }
      }
    })
  });
});