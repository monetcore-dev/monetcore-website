import { notFound } from "next/navigation";
import { services, findService } from "../../config/offeringCatalog";
import { pageMetadata } from "../../lib/metadata";
import OfferingShell from "../../components/catalog/OfferingShell";
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
  return <OfferingShell title={item.title} intro={item.intro} />;
}
