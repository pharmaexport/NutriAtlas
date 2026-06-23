type PageProps = {
  params: {
    code: string;
  };
};

async function getFood(code: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const response = await fetch(`${baseUrl}/api/foods/${code}`, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

export default async function FoodPage({ params }: PageProps) {
  const data = await getFood(params.code);

  if (!data) {
    return (
      <main className="foodPage pageSection">
        <p className="eyebrow">Aliment CIQUAL</p>
        <h1>Aliment indisponible.</h1>
        <p>La base PostgreSQL n’est pas encore connectée ou cet aliment n’a pas été trouvé.</p>
      </main>
    );
  }

  return (
    <main className="foodPage pageSection">
      <p className="eyebrow">Aliment CIQUAL {data.food.source_food_code}</p>
      <h1>{data.food.name}</h1>
      <p>{data.food.food_group_name_fr}</p>

      <section className="nutrientTable">
        {(data.nutrients || []).slice(0, 40).map((nutrient: any) => (
          <div className="nutrientLine" key={nutrient.source_column_name}>
            <span>{nutrient.name}</span>
            <strong>{nutrient.original_value || "-"} {nutrient.unit || ""}</strong>
          </div>
        ))}
      </section>
    </main>
  );
}
