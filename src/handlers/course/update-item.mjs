import { GetCommand } from '@aws-sdk/lib-dynamodb';
import AWS from 'aws-sdk';

const documentClient = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.COURSE_TABLE;

export const updateItemHandler = async (event) => {
    if (event.httpMethod !== 'PUT') {
        throw new Error(`postMethod only accepts PUT method, you tried: ${event.httpMethod} method.`);
    }

    console.info('received:', event);


    try {
        const body = JSON.parse(event.body);

        const { name, description } = body;

        const id = event.pathParameters.id;

        // Validation: Ensure that the required fields are present in the request body.
        if (!id && !name && !description) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Required fields are missing.' }),
            };
        }
        const item = { id: id, name: name, description: description };
        const courseData = await documentClient.get({
            TableName: tableName,
            Key: { id: id },
        }).promise();

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
            UpdateExpression: 'set #n = :name, #d = :description',
            ExpressionAttributeNames: {
                '#n': 'name',
                '#d': 'description',
            },
            ExpressionAttributeValues: {
                ':name': name || null,
                ':description': description || null,
            },
            ReturnValues: 'UPDATED_NEW',
        };

        const data = await documentClient.update(params).promise();
        console.log("Success - item updated", data);


        const response = {
            statusCode: 200,
            body: JSON.stringify({id: id, name: name, description: description})
        };

        console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
        return response;
    } catch (err) {
        console.log("Error", err.stack);

        return {
            statusCode: 500,
            body: err.stack
        }
    }
};
