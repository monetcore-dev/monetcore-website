export const customerState = {
  queries: [],
  session: null,
  fail: false,
  failAudit: false,
  rate: 1,
  request: null,
  released: 0,
  context: null,
};
export const organizationA = "00000000-0000-4000-8000-000000000001",
  organizationB = "00000000-0000-4000-8000-000000000002";
async function query(text, values = []) {
  customerState.queries.push({ text, values });
  if (customerState.fail)
    throw new Error("synthetic internal secret must never escape");
  if (text.includes("set_config")) {
    customerState.context = values[0];
    return { rows: [] };
  }
  if (text === "COMMIT" || text === "ROLLBACK") {
    customerState.context = null;
    return { rows: [] };
  }
  if (text.includes("request_limits"))
    return { rows: [{ count: customerState.rate }] };
  if (text.includes("JOIN customer.memberships"))
    return {
      rows:
        values[0] === "user-a" && (!values[1] || values[1] === organizationA)
          ? [
              {
                id: organizationA,
                name: "Synthetic A",
                role: "organization_member",
              },
            ]
          : [],
    };
  if (text.includes("INSERT INTO customer.project_requests")) {
    if (customerState.request) return { rows: [] };
    customerState.request = {
      id: "00000000-0000-4000-8000-000000000003",
      status: "submitted",
      payload_hash: values[3],
    };
    return { rows: [customerState.request] };
  }
  if (text.includes("SELECT id,status,payload_hash"))
    return { rows: customerState.request ? [customerState.request] : [] };
  if (
    text.includes("INSERT INTO customer.audit_events") &&
    customerState.failAudit
  )
    throw new Error("audit unavailable");
  return { rows: [], rowCount: 1 };
}
const pool = {
  query,
  connect: async () => ({ query, release: () => customerState.released++ }),
};
export function getCustomerPool() {
  return pool;
}
export function getCustomerAuthPool() {
  return pool;
}
export function getCustomerAuth() {
  return { api: { getSession: async () => customerState.session } };
}
export async function authAudit() {
  if (customerState.failAudit) throw new Error("audit unavailable");
}
