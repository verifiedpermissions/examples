import { Amplify } from 'aws-amplify';

interface AmplifyConfig {
  region: string;
  userPoolId: string;
  userPoolWebClientId: string;
  apiEndpoint: string;
}

export const configureAmplify = (config: AmplifyConfig): void => {
  Amplify.configure({
    Auth: {
      region: config.region,
      userPoolId: config.userPoolId,
      userPoolWebClientId: config.userPoolWebClientId,
    },
    API: {
      endpoints: [
        {
          name: 'petstore',
          endpoint: config.apiEndpoint,
        },
      ],
    },
  });
};
