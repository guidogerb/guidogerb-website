import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      // This configures a passwordless experience where users sign in with a code sent to their email.
      // The content is based on your settings in team-provider-info.json.
      verificationEmailBody: (createCode: () => string) => `Hi {{username}}, your verification code is ${createCode()}.`,
      verificationEmailSubject: "Welcome! Let's confirm your email.",
    },
  },
  // This defines the 'users' group for your application.
  groups: ['users'],
});