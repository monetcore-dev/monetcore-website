import { notFound } from "next/navigation";
import { products, findProduct } from "../../config/offeringCatalog";
import { pageMetadata } from "../../lib/metadata";
import ProductDetail from "../../components/catalog/ProductDetail";
import ProductExperience from "../../components/catalog/ProductExperience";
export const dynamicParams = false;
export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = findProduct(slug);
  return item ? pageMetadata(`/products/${slug}`, item.title, item.intro) : {};
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = findProduct(slug);
  if (!item) notFound();
  return (
    <ProductDetail item={item} demo={<ProductExperience kind={item.demo} />} />
  );
}
