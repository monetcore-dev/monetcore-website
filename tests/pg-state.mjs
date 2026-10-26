export const pgState = { configs: [], queries: [], result: { rows: [], rowCount: 1 }, error: null, idleError: null };
export class Pool {
  constructor(config) { pgState.configs.push(config); }
  on(name, callback) { if (name === 'error') pgState.idleError = callback; }
  async query(text, values) {
    pgState.queries.push({ text, values });
    if (pgState.error) throw pgState.error;
    return pgState.result;
  }
}
