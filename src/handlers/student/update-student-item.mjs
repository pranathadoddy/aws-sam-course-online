import { GetCommand } from '@aws-sdk/lib-dynamodb';
import AWS from 'aws-sdk';

const documentClient = new AWS.DynamoDB.DocumentClient();

const tableName = process.env.STUDENT_TABLE;

export const updateStudentItemHandler = async (event) => {
    if (event.httpMethod !== 'PUT') {
        throw new Error(`postMethod only accepts PUT method, you tried: ${event.httpMethod} method.`);
    }

    console.info('received:', event);


    try {
        const body = JSON.parse(event.body);

        const { firstName, lastName } = body;

        const id = event.pathParameters.id;

        // Validation: Ensure that the required fields are present in the request body.
        if (!id && !firstName && !lastName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Required fields are missing.' }),
            };
        }
        const item = { id: id, lastName: lastName, firstName: firstName };
        const studentData = await documentClient.get({
            TableName: tableName,
            Key: { id: id },
        }).promise();

        var studentItem = studentData.Item;

        if (!studentItem) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Student not found' }),
            };
        }


        const params = {
            TableName: tableName,
            Key: { id: id },
            UpdateExpression: 'set #f = :firstName, #l = :lastName',
            ExpressionAttributeNames: {
                '#f': 'firstName',
                '#l': 'lastName',
            },
            ExpressionAttributeValues: {
                ':firstName': firstName || null,
                ':lastName': lastName || null,
            },
            ReturnValues: 'UPDATED_NEW',
        };

        const data = await documentClient.update(params).promise();
        console.log("Success - item updated", data);

        const response = {
            statusCode: 200,
            body: JSON.stringify({id: id, firstName: firstName, lastName: lastName})
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
