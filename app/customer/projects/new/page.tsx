import Link from "next/link";
import { customerPagePrincipal } from "../../../lib/customer/pages";
import { customerDashboard } from "../../../lib/customer/repository";
import ProjectRequestForm from "./ProjectRequestForm";
export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ organization?: string }>;
}) {
  const principal = await customerPagePrincipal();
  if (!principal) return <p role="status">Workspace unavailable.</p>;
  let data;
  try {
    data = await customerDashboard(
      principal,
      (await searchParams).organization,
    );
  } catch {
    return (
      <p role="alert">
        Organization access could not be verified. Return to your dashboard or
        contact Monetcore.
      </p>
    );
  }
  if (!data.organization)
    return (
      <section className="customer-card">
        <h1>Organization access required</h1>
        <p>
          Contact Monetcore to arrange organization membership before submitting
          a project.
        </p>
        <Link href="/contact">Contact Monetcore</Link>
      </section>
    );
  return (
    <>
      <p className="customer-eyebrow">{data.organization.name}</p>
      <ProjectRequestForm organizationId={data.organization.id} />
    </>
  );
}
