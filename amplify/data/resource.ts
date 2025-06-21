import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. The
authorization rule below specifies that only the owner of a record can
"create", "read", "update", and "delete" it.
=========================================================================*/
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    }).authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool'
    // By removing apiKeyAuthorizationMode, you are ensuring that access to your API
    // is restricted to authenticated users, thus resolving the warning about
    // public access.
  },
});