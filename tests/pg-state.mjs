export const pgState = { configs: [], queries: [], result: { rows: [], rowCount: 1 }, error: null, idleError: null, queue: [], releases: [] };
export class Pool {
  constructor(config) { pgState.configs.push(config); }
  on(name, callback) { if (name === 'error') pgState.idleError = callback; }
  async connect() { return { query: this.query.bind(this), release: broken => pgState.releases.push(broken) }; }
  async query(text, values) {
    pgState.queries.push({ text, values });
    if (pgState.error) throw pgState.error;
    const result=pgState.queue.length?pgState.queue.shift():pgState.result;
    if(result instanceof Error)throw result;
    return result;
  }
}
