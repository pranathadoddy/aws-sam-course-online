import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.ENROLL_TABLE;
const studentTableName = process.env.STUDENT_TABLE;
const courseTableName = process.env.COURSE_TABLE;

export const putEnrollItemHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`);
    }

    try {

        console.info('received:', event);

        const body = JSON.parse(event.body);

        const { courseId, studentId } = body;

        // Validation: Ensure that the required fields are present in the request body.
        if (!courseId && !studentId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Required fields are missing.' }),
            };
        }

        const id = uuidv4();

        var studentParams = {
            TableName: studentTableName,
            Key: { id: studentId },
        };

        const studentData = await ddbDocClient.send(new GetCommand(studentParams));

        const studentItem = studentData.Item;

        if (!studentItem) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Student not found' }),
            };
        }

        var courseParams = {
            TableName: courseTableName,
            Key: { id: courseId },
        };

        const courseData = await ddbDocClient.send(new GetCommand(courseParams));

        const courseItem = courseData.Item;

        if (!courseItem) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'course not found' }),
            };
        }

        const item = { id: id, courseId: courseItem.id, studentId: studentItem.id, courseName: courseItem.name, courseDescription: courseItem.description };
        console.log(item);
        
        var params = {
            TableName: tableName,
            Item: item
        };

        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success - item added", data);

        const response = {
            statusCode: 200,
            body: JSON.stringify(item)
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
