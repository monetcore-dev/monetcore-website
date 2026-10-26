import { Pool } from 'pg';
const socket = process.env.MONETCORE_TEST_PG_SOCKET;
if (socket !== '/tmp/monetcore-vps-pg-socket') throw new Error('Disposable Unix socket required');
export const pool = new Pool({ host: socket, port: 5432, database: 'monetcore_db', user: 'monetcore_app', max: 5 });
export function getPostgresPool() { return pool; }
