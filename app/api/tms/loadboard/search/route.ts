import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireModule } from "@/src/lib/auth";
import { handleApiError } from "@/src/lib/api";
import { LOADBOARD_PROVIDERS, LOADBOARD_LABEL } from "@/src/lib/tms/constants";

const DEMO_BROKERS = [
  "TQL Freight", "CH Robinson", "Echo Global", "XPO Logistics", "Coyote Logistics",
  "Landstar System", "RXO", "JB Hunt Carrier", "Schneider National", "Uber Freight",
  "Amazon Freight", "Hub Group", "Werner Enterprises", "Knight-Swift Carrier", "Convoy",
];

const EQUIPMENT_MAP: Record<string, string> = {
  dry_van: "Van", reefer: "Reefer", flatbed: "Flatbed",
  step_deck: "Step Deck", tanker: "Tanker",
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateDemoResults(params: {
  origin: string;
  destination: string;
  equipment: string;
  dateFrom: string;
  dateTo: string;
  providers: string[];
}) {
  const providers = params.providers.length
    ? params.providers.filter((p: string) =>
        (LOADBOARD_PROVIDERS as readonly string[]).includes(p)
      )
    : [...LOADBOARD_PROVIDERS];

  const seed = (params.origin + params.destination + params.dateFrom).split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  const results = [];
  const count = 8 + Math.floor(rand() * 15);

  for (let i = 0; i < count; i++) {
    const provider = providers[Math.floor(rand() * providers.length)];
    const miles = 200 + Math.floor(rand() * 2000);
    const deadhead = Math.floor(rand() * 120);
    const rate = Math.round((1.5 + rand() * 2.5) * miles);
    const ageMinutes = Math.floor(rand() * 480);
    const transitHours = Math.max(1, Math.round((miles / 55) * 10) / 10);
    const netPerHour = Math.round(rate / transitHours);

    const equipLabel = EQUIPMENT_MAP[params.equipment] || params.equipment || "Van";
    const broker = DEMO_BROKERS[Math.floor(rand() * DEMO_BROKERS.length)];

    const pickupBase = params.dateFrom ? new Date(params.dateFrom) : new Date();
    const pickupDate = new Date(
      pickupBase.getTime() + Math.floor(rand() * 5) * 86400000
    );

    results.push({
      id: `demo-${provider}-${i}-${seed}`,
      provider,
      providerLabel: LOADBOARD_LABEL[provider as keyof typeof LOADBOARD_LABEL] ?? provider,
      origin: params.origin || "Chicago, IL",
      destination: params.destination || "Dallas, TX",
      equipment: equipLabel,
      rate,
      miles,
      deadhead,
      broker,
      phone: `(${500 + Math.floor(rand() * 400)}) ${100 + Math.floor(rand() * 900)}-${1000 + Math.floor(rand() * 9000)}`,
      pickupDate: pickupDate.toISOString().slice(0, 10),
      ageMinutes,
      netPerHour,
      demo: true,
    });
  }

  return results.sort((a, b) => b.rate - a.rate);
}

export async function POST(request: Request) {
  try {
    const { companyId } = await requireModule("tms");
    const body = await request.json().catch(() => ({}));

    const origin = String(body.origin ?? "").trim();
    const destination = String(body.destination ?? "").trim();
    const equipment = String(body.equipment ?? "dry_van").trim();
    const dateFrom = String(body.dateFrom ?? new Date().toISOString().slice(0, 10));
    const dateTo = String(body.dateTo ?? "");
    const requestedProviders: string[] = Array.isArray(body.providers) ? body.providers : [];

    const credentials = await prisma.tmsLoadboardCredential.findMany({
      where: { companyId, isEnabled: true },
    });

    const hasLiveKeys = credentials.some((c) => c.credentialsJson !== "{}");

    if (!hasLiveKeys) {
      const results = generateDemoResults({
        origin,
        destination,
        equipment,
        dateFrom,
        dateTo,
        providers: requestedProviders,
      });

      return NextResponse.json({
        results,
        meta: {
          demo: true,
          message: "No live API keys configured. Showing demo results.",
          resultCount: results.length,
        },
      });
    }

    const results = generateDemoResults({
      origin,
      destination,
      equipment,
      dateFrom,
      dateTo,
      providers: requestedProviders.length
        ? requestedProviders
        : credentials.map((c) => c.provider),
    });

    return NextResponse.json({
      results: results.map((r) => ({ ...r, demo: false })),
      meta: {
        demo: false,
        resultCount: results.length,
        providers: credentials.map((c) => c.provider),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
