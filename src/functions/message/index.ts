import { formatJSONResponse } from "@libs/apiGateway";
import { dynamo } from "@libs/dynamo";
import { websocket } from "@libs/websocket";
import { APIGatewayProxyEvent } from "aws-lambda";
import { UserConnectionRecord } from "src/types/dynamo";

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Attributes
    const { message } = JSON.parse(event.body);
    const tableName = process.env.ROOM_CONNECTION_TABLE_NAME;
    const { connectionId, domainName, stage } = event.requestContext;

    // Error Handling - Check for message
    if (!message) {
      await websocket.send({
        data: {
          message: "You need to add message on message",
          type: "err",
        },
        connectionId,
        domainName,
        stage,
      });
      return formatJSONResponse({});
    }

    const existingUser = await dynamo.get<UserConnectionRecord>(
      connectionId,
      tableName
    );

    if (!existingUser) {
      await websocket.send({
        data: {
          message: "You need to create or join a room",
          type: "err",
        },
        connectionId,
        domainName,
        stage,
      });
      return formatJSONResponse({});
    }

    const { name, roomCode } = existingUser;

    // Function Body - check if the roomCode exists
    const roomUsers = await dynamo.query<UserConnectionRecord>({
      pkValue: roomCode,
      tableName,
      index: "index1",
    });

    const otherUsers = roomUsers.filter((user) => user.id !== existingUser.id);

    const messagePromiseArr = otherUsers.map((user) => {
      const { id: connectionId, domainName, stage } = user;

      return websocket.send({
        data: {
          message,
          from: existingUser.name,
        },
        connectionId,
        domainName,
        stage,
      });
    });

    Promise.all(messagePromiseArr);
    //Return
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
