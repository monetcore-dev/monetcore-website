import { customerApi, readCustomerJson } from "../../../lib/customer/http";
import { getCustomerAuthPool } from "../../../lib/customer/database";
import { CustomerError } from "../../../lib/customer/config";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return customerApi(request, true, async (principal) => {
    const body = await readCustomerJson(request);
    if (
      body.action !== "deactivate" ||
      Object.keys(body).some((key) => key !== "action")
    )
      throw new CustomerError(400, "invalid_action");
    const client = await getCustomerAuthPool().connect();
    let broken = false;
    try {
      await client.query("BEGIN");
      await client.query(
        'UPDATE customer_auth.auth_user SET active=false,"updatedAt"=now() WHERE id=$1',
        [principal.userId],
      );
      await client.query(
        'DELETE FROM customer_auth.auth_session WHERE "userId"=$1',
        [principal.userId],
      );
      await client.query(
        "INSERT INTO customer_auth.auth_events (event,actor_id) VALUES ($1,$2)",
        ["account_deactivated", principal.userId],
      );
      await client.query("COMMIT");
    } catch {
      try {
        await client.query("ROLLBACK");
      } catch {
        broken = true;
      }
      throw new CustomerError(503, "deactivation_uncertain");
    } finally {
      client.release(broken);
    }
    return Response.json({ success: true });
  });
}
