import CustomerAuthForm from "./CustomerAuthForm";
import {
  customerEmailEnabled,
  customerRegistrationEnabled,
} from "../../lib/customer/config";
export default async function CustomerLogin({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; token?: string; verified?: string }>;
}) {
  const query = await searchParams;
  const token =
    typeof query.token === "string" &&
    /^[A-Za-z0-9_-]{10,500}$/.test(query.token)
      ? query.token
      : "";
  return (
    <>
      <CustomerAuthForm
        registrationEnabled={customerRegistrationEnabled()}
        emailEnabled={customerEmailEnabled()}
        initialMode={query.mode === "reset" && token ? "reset" : "login"}
        token={token}
      />
      {query.verified === "1" && (
        <p role="status">
          Email verification has returned. Sign in to check your account access.
        </p>
      )}
    </>
  );
}
