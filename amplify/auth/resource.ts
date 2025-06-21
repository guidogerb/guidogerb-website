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
      verificationEmail: `Hi {{username}}, your verification code is {####}.`,
      verificationEmailSubject: "Welcome! Let's confirm your email.",
    },
  },
  // This defines the 'users' group that your post-confirmation trigger uses.
  groups: ['users'],
  // This configures the post-confirmation trigger to automatically add new users to the 'users' group.
  triggers: {
    postConfirmation: {
      handler: `
        import { PostConfirmationTriggerHandler } from 'aws-lambda';
        import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";

        const client = new CognitoIdentityProviderClient();

        export const handler: PostConfirmationTriggerHandler = async (event) => {
          const command = new AdminAddUserToGroupCommand({
            UserPoolId: event.userPoolId,
            Username: event.userName,
            GroupName: 'users',
          });
          await client.send(command);
          return event;
        };
      `
    }
  }
});