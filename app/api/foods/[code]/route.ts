import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "../../../../lib/db";

export const dynamic = "force-dynamic";

type Params = {
  params: {
    code: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        source_food_code: params.code,
        status: "database_not_configured",
        message: "CIQUAL is ready to import, but PostgreSQL is not connected yet."
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      source_food_code: params.code,
      status: "database_connected_but_food_lookup_not_enabled_yet"
    },
    { status: 501 }
  );
}
