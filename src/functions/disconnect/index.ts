import { formatJSONResponse } from "@libs/apiGateway";
import { dynamo } from "@libs/dynamo";
import { APIGatewayProxyEvent } from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Attributes
    const tableName = process.env.ROOM_CONNECTION_TABLE_NAME;
    const { connectionId } = event.requestContext;

    await dynamo.delete(connectionId, tableName);

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
