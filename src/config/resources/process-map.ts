import * as dotenv from 'dotenv';
import { setEnv } from '@/utils/set-env';

const env = setEnv();

dotenv.config({ path: `env/.${env}.env` });

export const PRESENT_YEAR = String(new Date().getFullYear());

export const PORT = parseInt(process.env.SERVER_PORT) || 4000;
export const DOMAIN = process.env.DOMAIN || 'pbid.io';
export const SERVER_NAME = process.env.SERVER_NAME || 'Name this thing';
export const DOCS_PATH = process.env.DOCS_PATH || 'apidocs';
export const IP_WHITE_LIST = process.env.IP_WHITE_LIST || '';
export const SERVER_URL = process.env.SERVER_URL;
export const SERVER_PROTOCOL = process.env.SERVER_PROTOCOL;
export const SERVER_ADDRESS = process.env.SERVER_ADDRESS;

export const MONGO_HOST = process.env.MONGO_HOST || '';
export const MONGO_USERNAME = process.env.MONGO_INITDB_ROOT_USERNAME || '';
export const MONGO_PASSWORD = process.env.MONGO_INITDB_ROOT_PASSWORD || '';
export const MONGO_REPLICA_SET = process.env.MONGO_REPLICA_SET || '';
export const MONGO_REPLICA_INIT_PORT =
   process.env.MONGO_REPLICA_INIT_PORT || '';
export const MONGO_PORT = parseInt(process.env.PORT) || 0;
export const MONGO_DB_NAME = process.env.MONGO_INITDB_DATABASE || '';
export const MONGO_AUTH_SOURCE = process.env.MONGO_AUTH_SOURCE || '';
export const MONGO_SSL_BOOL = process.env.MONGO_SSL === 'true';
export const MONGO_PROTOCOL = process.env.MONGO_PROTOCOL || 'mongodb';

export const JWT_SECRET = process.env.JWT_SECRET || '';
export const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN) || 86400;

export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
export const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || '';
export const GITHUB_CLIENT_AUTH_PATH =
   process.env.GITHUB_CLIENT_AUTH_PATH || '';

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '';
export const GOOGLE_CLIENT_AUTH_PATH =
   process.env.GOOGLE_CLIENT_AUTH_PATH || '';


export const SENTRY_DSN = process.env.SENTRY_DSN || '';
