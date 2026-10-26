import {
  customerApi,
  readCustomerJson,
} from "../../../../../lib/customer/http";
import { submitProjectRequest } from "../../../../../lib/customer/repository";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> },
) {
  return customerApi(request, true, async (principal) => {
    const { organizationId } = await context.params;
    const result = await submitProjectRequest(
      principal,
      organizationId,
      await readCustomerJson(request),
    );
    return Response.json(
      { success: true, request: result },
      { status: result.duplicate ? 200 : 201 },
    );
  });
}
