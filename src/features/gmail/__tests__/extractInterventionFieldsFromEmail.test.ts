import { extractInterventionFieldsFromEmail } from "../extractInterventionFieldsFromEmail";

describe("extractInterventionFieldsFromEmail", () => {
  it("extrait une adresse rue + code postal", () => {
    const text = "Bonjour,\nRue de la Loi 16, 1000 Bruxelles\nMerci";
    const { address, phone } = extractInterventionFieldsFromEmail(text);
    expect(address).toMatch(/1000/);
    expect(phone).toBeNull();
  });

  it("extrait un numéro belge", () => {
    const text = "Appelez-moi au 0470 12 34 56 pour la porte.";
    const { phone } = extractInterventionFieldsFromEmail(text);
    expect(phone).toMatch(/0470/);
  });
});
