import CategoryContent from "./CategoryContent";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  return (
    <main className="p-6">
      <CategoryContent category={category} pageSize={20} />
    </main>
  );
}
