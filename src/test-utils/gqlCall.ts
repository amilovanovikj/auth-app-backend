import { graphql } from "graphql";
import { Maybe } from "graphql/jsutils/Maybe";
import { AuthContext } from "src/types";
import { createSchema } from "../utils/createSchema";


interface Options {
  source: string;
  variableValues?: Maybe<{
    [key: string]: any;
  }>,
  context: AuthContext
}

export const gqlCall = async ({ source, variableValues, context }: Options) => {
  return graphql({
    schema: await createSchema(),
    source,
    variableValues,
    contextValue: context
  });
}