## AWS Amplify React+Vite Starter Template

This repository provides a starter template for creating applications using React+Vite and AWS Amplify, emphasizing easy setup for authentication, API, and database capabilities.

## Overview

This template equips you with a foundational React application integrated with AWS Amplify, streamlined for scalability and performance. It is ideal for developers looking to jumpstart their project with pre-configured AWS services like Cognito, AppSync, and DynamoDB.

## Features

- **Authentication**: Setup with Amazon Cognito for secure user authentication.
- **API**: Ready-to-use GraphQL endpoint with AWS AppSync.
- **Database**: Real-time database powered by Amazon DynamoDB.

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/react/start/quickstart/#deploy-a-fullstack-app-to-aws) of our documentation.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

## Getting Started
npx ampx sandbox
npm run dev
npx ampx generate outputs


for r in us-east-1 us-west-2 eu-west-1 ap-southeast-2; do
echo "🔎 $r"
aws amplify list-apps --region $r --query 'apps[*].[appId,name]' --output text
done
🔎 us-east-1
d295eioxqacudl  guidogerb-website
d31al9t04be7ye  garygerber-website
🔎 us-west-2
🔎 eu-west-1
🔎 ap-southeast-2