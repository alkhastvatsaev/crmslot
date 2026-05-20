import { config } from "dotenv";
config({ path: ".env.local" });
import { placeOrderViaPlaywright } from "./src/features/catalog/lecotPlaywrightScraper";

async function main() {
  console.log("Starting script...");
  try {
    const result = await placeOrderViaPlaywright([{ sku: "A1553", label: "Litto Serrure", quantity: 1 }], {
      firstName: "A",
      lastName: "B",
      companyName: "C",
      email: "alkhastvatsaev@icloud.com",
      phone: "0102030405",
      street: "A",
      city: "B",
      postalCode: "1000",
    });
    console.log("Result:", result);
  } catch (err) {
    console.error("Crash:", err);
  }
}
main();
