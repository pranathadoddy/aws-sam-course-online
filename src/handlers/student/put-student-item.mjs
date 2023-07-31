import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.STUDENT_TABLE;

export const putStudentItemHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }

    console.info('received:', event);

    const body = JSON.parse(event.body);

    const { firstName, lastName } = body;

    // Validation: Ensure that the required fields are present in the request body.
    if (!firstName && !lastName) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Required fields are missing.' }),
        };
    }

    const id = uuidv4();

    const item = { id: id, firstName: firstName, lastName: lastName };
    var params = {
        TableName: tableName,
        Item: item
    };

    try {
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - item added", data);
    } catch (err) {
        console.log("Error", err.stack);

        return {
            statusCode: 500,
            body: err.stack
        }
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify(item)
    };

    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};
