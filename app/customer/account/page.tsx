import Link from "next/link";
import { customerPagePrincipal } from "../../lib/customer/pages";
import AccountActions from "./AccountActions";
export default async function AccountPage() {
  const principal = await customerPagePrincipal();
  if (!principal) return <p role="status">Account unavailable.</p>;
  return (
    <section className="customer-card">
      <h1>Account settings</h1>
      <p>{principal.name}</p>
      <p>{principal.email} · Email verified</p>
      <p>
        To change your password, use{" "}
        <Link href="/customer/login">account recovery</Link>. Organization and
        internal access changes require separate authorization.
      </p>
      <AccountActions />
      <p>
        For privacy requests, email{" "}
        <a href="mailto:hello@monetcore.dev">hello@monetcore.dev</a>.
        Deactivation does not automatically erase records.
      </p>
    </section>
  );
}
