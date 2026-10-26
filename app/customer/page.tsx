import Link from "next/link";
import { customerPagePrincipal } from "../lib/customer/pages";
import { customerDashboard } from "../lib/customer/repository";
export default async function CustomerHome({
  searchParams,
}: {
  searchParams: Promise<{ organization?: string }>;
}) {
  const principal = await customerPagePrincipal();
  if (!principal)
    return (
      <p role="status">
        Your workspace is unavailable. Please contact Monetcore.
      </p>
    );
  let data;
  try {
    data = await customerDashboard(
      principal,
      (await searchParams).organization,
    );
  } catch {
    return (
      <section className="customer-card" role="status">
        <h1>Workspace unavailable</h1>
        <p>
          We could not load the requested organization. Check your access with
          Monetcore.
        </p>
        <Link href="/customer">Return to your organizations</Link>
      </section>
    );
  }
  return (
    <>
      <p className="customer-eyebrow">Your Monetcore workspace</p>
      <h1>Welcome, {principal.name}</h1>
      <p>Review your projects and share requirements with our team.</p>
      <section className="customer-card">
        <h2>Your organization</h2>
        {data.organization ? (
          <>
            <p>
              {data.organization.name} ·{" "}
              {data.organization.role === "organization_admin"
                ? "Organization Admin"
                : "Organization Member"}
            </p>
            {data.organizations.length > 1 && (
              <ul className="customer-list">
                {data.organizations.map((org) => (
                  <li key={org.id}>
                    <Link href={`/customer?organization=${org.id}`}>
                      {org.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              className="customer-button"
              href={`/customer/projects/new?organization=${data.organization.id}`}
            >
              New project request
            </Link>
          </>
        ) : (
          <p>
            No organization has been assigned to your account. Contact Monetcore
            to arrange access. Registration does not grant internal or
            administrator privileges.
          </p>
        )}
      </section>
      <div className="customer-grid">
        <section className="customer-card">
          <h2>Projects</h2>
          {data.projects.length ? (
            <ul className="customer-list">
              {data.projects.map((project) => (
                <li key={project.id}>
                  <strong>{project.title}</strong>
                  <p>
                    <span className="customer-status">
                      {project.status.replaceAll("_", " ")}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No projects yet. An approved project will appear here once it has
              been scoped with our team.
            </p>
          )}
        </section>
        <section className="customer-card">
          <h2>Project requests</h2>
          {data.requests.length ? (
            <ul className="customer-list">
              {data.requests.map((request) => (
                <li key={request.id}>
                  <strong>{request.title}</strong>
                  <p>
                    {request.category} ·{" "}
                    <span className="customer-status">
                      {request.status.replaceAll("_", " ")}
                    </span>
                  </p>
                  <small>Reference: {request.id}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No requests submitted yet. Tell us what you want to build;
              submission does not create a contract or confirm pricing.
            </p>
          )}
        </section>
      </div>
      <section className="customer-card">
        <h2>Recent activity</h2>
        {data.activity.length ? (
          <ul className="customer-list">
            {data.activity.map((event) => (
              <li key={event.id}>
                Project request submitted · {event.created_at.slice(0, 10)}
              </li>
            ))}
          </ul>
        ) : (
          <p>No recorded activity yet.</p>
        )}
      </section>
    </>
  );
}
