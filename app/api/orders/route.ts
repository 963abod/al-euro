import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { PARTS } from "@/lib/data";

const SECRET =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV !== "production"
    ? "al-euro-local-dev-secret-change-me"
    : "");
const MAX_DEBT_LIMIT = 1200;
const MAX_ITEM_QUANTITY = 100;

type Session = {
  role: "workshop" | "marketer";
  name: string;
  phone: string;
  iat: number;
};

function verifySession(cookieHeader: string): Session | null {
  if (!SECRET) return null;

  try {
    const token = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("euro_session="))
      ?.slice("euro_session=".length);

    if (!token) return null;

    const [dataB64, sig, extra] = decodeURIComponent(token).split(".");
    if (!dataB64 || !sig || extra) return null;

    const payload = Buffer.from(dataB64, "base64url").toString("utf8");
    const expectedSig = createHmac("sha256", SECRET).update(payload).digest();
    const receivedSig = Buffer.from(sig, "base64url");

    if (
      receivedSig.length !== expectedSig.length ||
      !timingSafeEqual(receivedSig, expectedSig)
    ) {
      return null;
    }

    const session = JSON.parse(payload) as Partial<Session>;
    const now = Date.now();

    if (
      (session.role !== "workshop" && session.role !== "marketer") ||
      typeof session.name !== "string" ||
      typeof session.phone !== "string" ||
      typeof session.iat !== "number" ||
      !Number.isFinite(session.iat) ||
      now - session.iat > 7 * 24 * 60 * 60 * 1000 ||
      session.iat > now + 60_000
    ) {
      return null;
    }

    return session as Session;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!SECRET) {
    return NextResponse.json(
      { error: "إعداد AUTH_SECRET مفقود على الخادم" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة" }, { status: 400 });
  }

  const { items, pay, file } = body as {
    items?: unknown;
    pay?: unknown;
    file?: unknown;
  };

  if (
    !items ||
    typeof items !== "object" ||
    Array.isArray(items) ||
    !Object.keys(items).length
  ) {
    return NextResponse.json({ error: "السلة فارغة أو غير صالحة" }, { status: 400 });
  }

  if (pay !== "sham" && pay !== "cod" && pay !== "debt") {
    return NextResponse.json({ error: "طريقة دفع غير صالحة" }, { status: 400 });
  }

  if (pay === "sham" && (typeof file !== "string" || !file.trim())) {
    return NextResponse.json(
      { error: "يرجى إرفاق إشعار تحويل شام كاش" },
      { status: 400 }
    );
  }

  const requestedItems = items as Record<string, unknown>;
  const validIds = new Set(PARTS.map((part) => String(part.id)));

  for (const [id, quantity] of Object.entries(requestedItems)) {
    if (
      !validIds.has(id) ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_ITEM_QUANTITY
    ) {
      return NextResponse.json(
        { error: "توجد قطعة أو كمية غير صالحة في السلة" },
        { status: 400 }
      );
    }
  }

  const rows = PARTS.filter((part) => Object.prototype.hasOwnProperty.call(requestedItems, String(part.id)));
  if (!rows.length) {
    return NextResponse.json({ error: "لا توجد قطع صالحة في السلة" }, { status: 400 });
  }

  const unavailable = rows.find((part) => part.stock < (requestedItems[String(part.id)] as number));
  if (unavailable) {
    return NextResponse.json(
      { error: `الكمية المطلوبة من «${unavailable.name}» غير متوفرة حاليًا` },
      { status: 400 }
    );
  }

  const serverTotal = rows.reduce(
    (sum, part) => sum + part.price * (requestedItems[String(part.id)] as number),
    0
  );

  if (!Number.isFinite(serverTotal) || serverTotal <= 0) {
    return NextResponse.json({ error: "قيمة الطلب غير صالحة" }, { status: 400 });
  }

  if (pay === "debt") {
    const session = verifySession(req.headers.get("cookie") || "");

    if (!session || session.role !== "workshop") {
      return NextResponse.json(
        { error: "غير مصرح: الدفع عبر دفتر الدين متاح حصريًا لحسابات الورشات المعتمدة" },
        { status: 403 }
      );
    }

    if (serverTotal > MAX_DEBT_LIMIT) {
      return NextResponse.json(
        { error: `قيمة الطلب تتجاوز سقف الدين المتاح (${MAX_DEBT_LIMIT}$)` },
        { status: 400 }
      );
    }
  }

  // هذه المرحلة تتحقق من الطلب فقط؛ الحفظ الدائم في قاعدة البيانات غير مفعّل بعد.
  return NextResponse.json({
    ok: true,
    orderId: `ORD-${Date.now().toString().slice(-6)}`,
    pay,
    total: serverTotal,
  });
}
