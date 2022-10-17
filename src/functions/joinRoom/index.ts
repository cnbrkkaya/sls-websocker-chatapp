import { formatJSONResponse } from "@libs/apiGateway";
import { dynamo } from "@libs/dynamo";
import { websocket } from "@libs/websocket";
import { APIGatewayProxyEvent } from "aws-lambda";
import { UserConnectionRecord } from "src/types/dynamo";

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Attributes
    const { name, roomCode } = JSON.parse(event.body);
    const tableName = process.env.ROOM_CONNECTION_TABLE_NAME;
    const { connectionId, domainName, stage } = event.requestContext;

    // Error Handling - If there is no name provided in the request exit early
    if (!name) {
      await websocket.send({
        data: {
          message: 'You needs a "name" on joinRoom',
          type: "err",
        },
        connectionId,
        domainName,
        stage,
      });
      return formatJSONResponse({});
    }
    // Error Handling - If there is no roomCode provided in the request exit early
    if (!roomCode) {
      await websocket.send({
        data: {
          message: 'You needs a "roomCode" on joinRoom',
          type: "err",
        },
        connectionId,
        domainName,
        stage,
      });
      return formatJSONResponse({});
    }

    // Function Body - check if the roomCode exists
    const roomUsers = await dynamo.query({
      pkValue: roomCode,
      tableName,
      index: "index1",
      // Just 1 user is enough to prove that the room exists
      limit: 1,
    });

    // Error Handling - If there is no room exit early
    if (roomUsers.length === 0) {
      await websocket.send({
        data: {
          message: "That room does not exists",
          type: "err",
        },
        connectionId,
        domainName,
        stage,
      });
      return formatJSONResponse({});
    }

    // Function Body - If there is no error prepare and write the record to ddb
    const data: UserConnectionRecord = {
      id: connectionId,
      pk: roomCode,
      sk: connectionId,
      roomCode,
      name,
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
