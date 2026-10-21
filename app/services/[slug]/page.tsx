import { notFound } from "next/navigation";
import { services, findService } from "../../config/offeringCatalog";
import { pageMetadata } from "../../lib/metadata";
import ServiceDetail from "../../components/catalog/ServiceDetail";
import ServiceExperience from "../../components/catalog/ServiceExperience";
export const dynamicParams = false;
export function generateStaticParams() {
  return services.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = findService(slug);
  return item ? pageMetadata(`/services/${slug}`, item.title, item.intro) : {};
}
export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = findService(slug);
  if (!item) notFound();
  return (
    <ServiceDetail item={item} demo={<ServiceExperience kind={item.demo} />} />
  );
}
