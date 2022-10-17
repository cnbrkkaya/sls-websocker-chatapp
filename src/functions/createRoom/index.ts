import { formatJSONResponse } from "@libs/apiGateway";
import { dynamo } from "@libs/dynamo";
import { websocket } from "@libs/websocket";
import { APIGatewayProxyEvent } from "aws-lambda";
import { UserConnectionRecord } from "src/types/dynamo";
import { v4 as uuid } from "uuid";

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Attributes
    const body = JSON.parse(event.body);
    const tableName = process.env.ROOM_CONNECTION_TABLE_NAME;
    const { connectionId, domainName, stage } = event.requestContext;

    // Error Handling - If there is no name provided in the request exit early
    if (!body.name) {
      await websocket.send({
        data: {
          message: 'You needs a "name" on createRoom',
          type: "err",
        },
        connectionId,
        domainName,
        stage,
      });
      return formatJSONResponse({});
    }
    
    // Function Body - If there is no error prepare and write the record to ddb
    const roomCode = uuid().slice(0, 8);
    const data: UserConnectionRecord = {
      id: connectionId,
      pk: roomCode,
      sk: connectionId,

      roomCode,
      name: body.name,
      domainName,
      stage,
    };
    await dynamo.write(data, tableName);

    // Function End - If ddb request successfull return response to the user.
    await websocket.send({
      data: {
        message: `You are now connected to room ${roomCode}`,
        type: "info",
      },
      connectionId,
      domainName,
      stage,
    });

    // Return
    return formatJSONResponse({});
  } catch (error) {
    console.log("error", error);
    return formatJSONResponse({
      statusCode: 502,
      data: {
        message: error.message,
      },
    });
  }
};
