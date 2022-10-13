import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  PostToConnectionCommandInput,
} from "@aws-sdk/client-apigatewaymanagementapi";

export const websocket = {
  send: async ({
    data,
    connectionId,
    domainName,
    stage,
  }: {
    data: {
      message?: string;
      type?: string;
      from?: string;
    };
    connectionId: string;
    domainName: string;
    stage: string;
  }) => {
    const client = new ApiGatewayManagementApiClient({
      endpoint: `https://${domainName}/${stage}`,
    });

    const params: PostToConnectionCommandInput = {
      Data: JSON.stringify(data) as any,
      ConnectionId: connectionId,
    };
    const command = new PostToConnectionCommand(params);

    return client.send(command);
  },
};
