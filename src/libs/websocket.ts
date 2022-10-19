import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  PostToConnectionCommandInput,
} from "@aws-sdk/client-apigatewaymanagementapi";

export const websocket = {
  createClient: ({
    domainName,
    stage,
  }: {
    domainName: string;
    stage: string;
  }) => {
    // Creating Client
    const client = new ApiGatewayManagementApiClient({
      endpoint: `https://${domainName}/${stage}`,
    });

    return client;
  },

  send: async ({
    data,
    connectionId,
    domainName,
    stage,
    client,
  }: {
    data: {
      message?: string;
      type?: string;
      from?: string;
    };
    connectionId: string;
    domainName?: string;
    stage?: string;
    client?: ApiGatewayManagementApiClient;
  }) => {
    if (!client) {
      if (!domainName || !stage) {
        throw Error("DomainName or Stage is missing");
      }
      client = websocket.createClient({
        domainName,
        stage,
      });
    }
    // Prepare params and create the command
    const params: PostToConnectionCommandInput = {
      Data: JSON.stringify(data) as any,
      ConnectionId: connectionId,
    };
    const command = new PostToConnectionCommand(params);

    //Send the request
    return client.send(command);
  },
};
