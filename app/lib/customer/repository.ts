import "server-only";
import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import type { CustomerPrincipal } from "./session";
import { getCustomerPool } from "./database";
import { CustomerError } from "./config";
import { uuid, validateProjectRequest } from "./validation";
export type Organization = {
  id: string;
  name: string;
  role: "organization_admin" | "organization_member";
};
export type Project = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
};
export type ProjectRequest = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
};
export type Activity = { id: string; event: string; created_at: string };
/** Transaction-local identity is cleared by COMMIT/ROLLBACK; never pool-level SET. */
export async function customerTransaction<T>(
  principal: CustomerPrincipal,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getCustomerPool().connect();
  let begun = false;
  let broken = false;
  try {
    await client.query("BEGIN");
    begun = true;
    await client.query("SELECT set_config('app.customer_user_id',$1,true)", [
      principal.userId,
    ]);
    const result = await work(client);
    await client.query("COMMIT");
    begun = false;
    return result;
  } catch (error) {
    if (begun) {
      try {
        await client.query("ROLLBACK");
      } catch {
        broken = true;
        throw new CustomerError(503, "transaction_uncertain");
      }
    }
    throw error;
  } finally {
    client.release(broken);
  }
}
export async function authorizedOrganization(
  client: PoolClient,
  principal: CustomerPrincipal,
  organizationId: string,
) {
  uuid(organizationId);
  const result = await client.query<Organization>(
    `SELECT o.id,o.name,m.role FROM customer.organizations o JOIN customer.memberships m ON m.organization_id=o.id WHERE m.user_id=$1 AND m.active=true AND o.id=$2 AND o.active=true`,
    [principal.userId, organizationId],
  );
  if (result.rows.length !== 1)
    throw new CustomerError(403, "membership_required");
  return result.rows[0];
}
export async function customerDashboard(
  principal: CustomerPrincipal,
  requestedOrganization?: string,
) {
  return customerTransaction(principal, async (client) => {
    const memberships = await client.query<Organization>(
      `SELECT o.id,o.name,m.role FROM customer.organizations o JOIN customer.memberships m ON m.organization_id=o.id WHERE m.user_id=$1 AND m.active=true AND o.active=true ORDER BY o.name,o.id`,
      [principal.userId],
    );
    const id = requestedOrganization ?? memberships.rows[0]?.id;
    if (!id)
      return {
        organizations: memberships.rows,
        organization: null,
        projects: [],
        requests: [],
        activity: [],
      };
    const organization = await authorizedOrganization(client, principal, id);
    const projects = await client.query<Project>(
      "SELECT id,title,status,updated_at::text FROM customer.projects WHERE organization_id=$1 ORDER BY updated_at DESC LIMIT 100",
      [organization.id],
    );
    const requests = await client.query<ProjectRequest>(
      "SELECT id,title,category,status,created_at::text FROM customer.project_requests WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100",
      [organization.id],
    );
    const activity = await client.query<Activity>(
      "SELECT id,event,created_at::text FROM customer.audit_events WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 20",
      [organization.id],
    );
    return {
      organizations: memberships.rows,
      organization,
      projects: projects.rows,
      requests: requests.rows,
      activity: activity.rows,
    };
  });
}
export async function submitProjectRequest(
  principal: CustomerPrincipal,
  organizationId: string,
  body: unknown,
) {
  const fields = validateProjectRequest(body);
  const hash = createHash("sha256")
    .update(JSON.stringify({ ...fields, idempotencyKey: undefined }))
    .digest("hex");
  return customerTransaction(principal, async (client) => {
    const organization = await authorizedOrganization(
      client,
      principal,
      organizationId,
    );
    const result = await client.query<{ id: string; status: string }>(
      `INSERT INTO customer.project_requests (organization_id,submitted_by,idempotency_key,payload_hash,title,category,objectives,requirements,budget,timeline,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (organization_id,submitted_by,idempotency_key) DO NOTHING RETURNING id,status`,
      [
        organization.id,
        principal.userId,
        fields.idempotencyKey,
        hash,
        fields.title,
        fields.category,
        fields.objectives,
        fields.requirements,
        fields.budget,
        fields.timeline,
        fields.notes,
      ],
    );
    if (result.rows.length === 0) {
      const existing = await client.query<{
        id: string;
        status: string;
        payload_hash: string;
      }>(
        "SELECT id,status,payload_hash FROM customer.project_requests WHERE organization_id=$1 AND submitted_by=$2 AND idempotency_key=$3",
        [organization.id, principal.userId, fields.idempotencyKey],
      );
      if (existing.rows.length !== 1 || existing.rows[0].payload_hash !== hash)
        throw new CustomerError(409, "idempotency_conflict");
      return {
        id: existing.rows[0].id,
        status: existing.rows[0].status,
        duplicate: true,
      };
    }
    if (result.rows.length !== 1)
      throw new CustomerError(503, "insert_uncertain");
    await client.query(
      "INSERT INTO customer.audit_events (organization_id,actor_id,event,resource_id) VALUES ($1,$2,$3,$4)",
      [
        organization.id,
        principal.userId,
        "project_request_submitted",
        result.rows[0].id,
      ],
    );
    return { ...result.rows[0], duplicate: false };
  });
}
