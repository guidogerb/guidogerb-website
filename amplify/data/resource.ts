import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. The
authorization rule below specifies that only the owner of a record can
"create", "read", "update", and "delete" it.
=========================================================================*/
const schema = a.schema({
  // Basic Todo example remains
  Todo: a
    .model({
      content: a.string(),
    }).authorization(allow => [allow.owner()]),

  // Phase 0: Authentication and Roles — add UserProfile model and Role enum
  Role: a.enum(["VISITOR", "CUSTOMER", "CREATOR", "ADMIN"]),
  UserProfile: a
    .model({
      id: a.id().required(), // We'll use the Cognito userId as the id
      displayName: a.string().required(),
      role: a.ref("Role").required(),
      avatarUrl: a.string(),
      bio: a.string(),
      socialLinks: a.json(), // e.g., { website, twitter, instagram }
    })
    .authorization(allow => [allow.owner()]),
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