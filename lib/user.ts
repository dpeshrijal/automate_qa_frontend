/**
 * User management functions
 * Separate from auth.ts to avoid Edge Runtime issues
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME || "";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const docClient = DynamoDBDocumentClient.from(client);

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

/**
 * Create a new user in DynamoDB
 */
export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 12);

  const user: User = {
    id: randomUUID(),
    email,
    name: name || email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: USERS_TABLE_NAME,
      Item: user,
    })
  );

  return user;
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: USERS_TABLE_NAME,
      IndexName: "EmailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  return result.Items[0] as User;
}

/**
 * Verify a user's password
 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
