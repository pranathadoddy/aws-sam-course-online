import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.COURSE_TABLE;

export const deleteItemHandler = async (event) => {
    if (event.httpMethod !== 'DELETE') {
        throw new Error(`postMethod only accepts DELETE method, you tried: ${event.httpMethod} method.`);
    }

    try {
        console.info('received:', event);


        const id = event.pathParameters.id;

        // Validation: Ensure that the required fields are present in the request body.
        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Required fields are missing.' }),
            };
        }

        const courseData = await ddbDocClient.send(new GetCommand({
            TableName: tableName,
            Key: { id: id },
        }));

        var courseItem = courseData.Item;

        if (!courseItem) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Course not found' }),
            };
        }

        const params = {
            TableName: tableName,
            Key: { id: id },
        };


        const data = await ddbDocClient.send(new DeleteCommand(params));
        console.log("Success - item deleted", data);
    } catch (err) {
        console.log("Error", err.stack);

        return {
            statusCode: 500,
            body: err.stack
        }
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify("Delete Success")
    };

    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
