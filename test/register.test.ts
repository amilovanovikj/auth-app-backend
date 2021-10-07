
import { gqlCall } from "../src/test-utils/gqlCall";
import { getDatabaseConnection } from "../src/utils/getDatabaseConnection";
import { Request, Response } from 'express';
import { Session, SessionData } from 'express-session';
import { Connection } from "typeorm";
import { User } from "../src/entities/User";

let conn: Connection;
beforeAll(async () => {
  conn = await getDatabaseConnection();
})
afterAll(async () => {
  await conn.close()
})

const registerMutation = `mutation Register($options: EmailPasswordInput!) {
  register(options: $options) {
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

describe('register', () => {
  it("should create user when email and password are OK", async () => {
    const user = {
      email: "user01@domain.xyz",
      password: "goodP4ssw0rd"
    }
    await gqlCall({
      source: registerMutation,
      variableValues: {
        options: user
      },
      context: { req, res }
    })

    // expect(response).toMatchObject({
    //   data: {
    //     register: {
    //       errors: null,
    //       user: {
    //         email: user.email
    //       }
    //     }
    //   }
    // })

    const dbUser = await User.findOne({ email: user.email })
    expect(dbUser).toBeDefined()
  });

  it("should not create user with invalid email", async () => {
    const user = {
      email: "user05",
      password: "iDontHave3mai1"
    }

    const response = await gqlCall({
      source: registerMutation,
      variableValues: {
        options: user
      },
      context: { req, res }
    })

    expect(response).toMatchObject({
      data: {
        register: {
          errors: [
            {
              field: "email",
              message: "invalid email address"
            }
          ],
          user: null
        }
      }
    })
  });

  it("should not create user with the same email", async () => {
    const user = {
      email: "user01@domain.xyz",
      password: "meAgain123"
    }

    const response = await gqlCall({
      source: registerMutation,
      variableValues: {
        options: user
      },
      context: { req, res }
    })

    expect(response).toMatchObject({
      data: {
        register: {
          errors: [
            {
              field: "email",
              message: "a user with that email address already exists"
            }
          ],
          user: null
        }
      }
    })
  });

  it("should not create user with short password", async () => {
    const user = {
      email: "user02@domain.xyz",
      password: "badP4ss"
    }

    const response = await gqlCall({
      source: registerMutation,
      variableValues: {
        options: user
      },
      context: { req, res }
    })

    expect(response).toMatchObject({
      data: {
        register: {
          errors: [
            {
              field: "password",
              message: "invalid password length"
            }
          ],
          user: null
        }
      }
    })
  });

  it("should not create user without a digit in the password", async () => {
    const user = {
      email: "user03@domain.xyz",
      password: "badPassword"
    }

    const response = await gqlCall({
      source: registerMutation,
      variableValues: {
        options: user
      },
      context: { req, res }
    })

    expect(response).toMatchObject({
      data: {
        register: {
          errors: [
            {
              field: "password",
              message: "password must contain at least one digit"
            }
          ],
          user: null
        }
      }
    })
  });

  it("should not create user without letters in the password", async () => {
    const user = {
      email: "user04@domain.xyz",
      password: "123456789"
    }

    const response = await gqlCall({
      source: registerMutation,
      variableValues: {
        options: user
      },
      context: { req, res }
    })

    expect(response).toMatchObject({
      data: {
        register: {
          errors: [
            {
              field: "password",
              message: "password must contain at least one letter"
            }
          ],
          user: null
        }
      }
    })
  });
})