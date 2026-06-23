export type LecotGuestInfo = {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  vatNumber?: string | null;
};

export type LecotPlaywrightResult =
  | { ok: true; source: "playwright"; orderId?: string }
  | { ok: true; source: "playwright_cart_ready"; message: string }
  | { ok: false; source: "playwright"; error: string };
