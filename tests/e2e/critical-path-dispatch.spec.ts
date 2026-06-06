import { test, expect } from "@playwright/test";

test.describe("Dispatch Critical Path", () => {
  test("Complete flow: Client Request -> Backoffice Inbox -> Technician Hub", async ({ page }) => {
    test.setTimeout(120_000);

    // 1. Ouvrir l'application
    await page.goto("/");

    // Attendre que l'interface soit chargée
    await expect(page.locator('[data-testid="dashboard-pager-root"]')).toBeVisible({
      timeout: 15_000,
    });

    // Naviguer vers l’espace société (Spotlight — hors carrousel)
    await page.locator('[data-testid="spotlight-trigger"]').click();
    await page.locator('[data-testid="nav-item-1"]').click();

    // Attendre le chargement du Company Hub
    await expect(page.locator('[data-testid="requester-intervention-panel"]')).toBeVisible({
      timeout: 15_000,
    });

    // --- ETAPE 1: CLIENT SOUMET UNE DEMANDE ---

    // Remplissage du profil (Rail gauche)
    await page.locator('[data-testid="requester-type-particulier"]').click();
    const profilePanel = page.locator('[data-testid="requester-profile-panel"]');
    await profilePanel.locator('input[type="text"]').nth(0).fill("Jean");
    await profilePanel.locator('input[type="text"]').nth(1).fill("Dupont");
    await profilePanel.locator('input[type="tel"]').fill("0470123456");
    await profilePanel.locator('input[type="email"]').fill("jean.dupont@example.com");

    // Formulaire d'intervention (Rail central)
    const interventionPanel = page.locator('[data-testid="requester-intervention-panel"]');

    // Etape 0: Choix du problème (clic sur le premier template)
    await interventionPanel.locator("button").nth(0).click();

    // Etape 1: Description
    await interventionPanel.locator("textarea").fill("Fuite d'eau importante sous l'évier.");
    const nextBtn = page.locator(
      'button[aria-label="Étape suivante"], button[aria-label="Volgende stap"], button[aria-label="Next step"]'
    );
    await nextBtn.click(); // Vers Etape 2

    // Etape 2: Photos (Required!)
    await expect(interventionPanel.locator('input[type="file"]')).toBeAttached({ timeout: 10_000 });
    const fileInput = interventionPanel.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      ),
    });
    // Attendre que la photo s'affiche (on attend qu'il n'y ait plus l'état vide pour la première case)
    await page.waitForTimeout(1000);
    await nextBtn.click(); // Vers Etape 3

    // Etape 3: Horaires
    // Attendre que le composant charge les créneaux
    await page.waitForTimeout(1000);
    // Sélectionner le premier créneau horaire disponible (ça va auto-avancer vers Etape 4)
    const timeSlot = page
      .locator("button")
      .filter({ hasText: /([0-1]?[0-9]|2[0-3]):[0-5][0-9]/ })
      .first();
    await expect(timeSlot).toBeVisible({ timeout: 10_000 });
    await timeSlot.click(); // Vers Etape 4

    // Etape 4: Soumission (Adresse + Bouton)
    await page.waitForTimeout(1000);
    const addressInput = interventionPanel.locator('[data-testid="smart-form-address"]');
    await expect(addressInput).toBeVisible({ timeout: 5000 });
    await addressInput.fill("Rue de la Loi 16, Bruxelles");
    await page.keyboard.press("Escape"); // Fermer l'autocomplete

    const submitBtn = interventionPanel
      .locator("button")
      .filter({ hasText: /Envoyer la demande|Verzoek indienen|Submit request/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
    await submitBtn.click();
    await page.waitForTimeout(2000);

    // --- ETAPE 2: BACKOFFICE REÇOIT ET ASSIGNE ---

    // Retour carte IVANA (hub société hors carrousel — flèche prev souvent désactivée)
    const spotlight = page.locator('[data-testid="spotlight-trigger"]');
    await expect(spotlight).toBeVisible({ timeout: 15_000 });
    await spotlight.click();
    await page.locator('[data-testid="nav-item-0"]').click();
    await expect(page.locator('[data-testid="dashboard-page-home"]')).toBeVisible({
      timeout: 15_000,
    });

    // Inbox back-office (rail droit) — onglet Demandes
    await page.locator('[data-testid="backoffice-inbox-tab-requests"]').click();

    // On prend la carte qui correspond à notre description
    const requestCard = page
      .locator('[data-testid^="backoffice-inbox-request-row-"]')
      .filter({ hasText: "Fuite d'eau importante" })
      .first();
    await expect(requestCard).toBeVisible({ timeout: 15_000 });

    // Cliquer sur la demande pour l'ouvrir
    await requestCard.click();

    // Cliquer sur "Assigner"
    await page.locator('[data-testid="backoffice-inbox-assign"]').click();

    // Le panneau TechnicianAssignPicker s'ouvre
    const assignPicker = page.locator('[data-testid="technician-assign-picker"]');
    await expect(assignPicker).toBeVisible();

    // Attendre que l'algorithme charge les techniciens, puis cliquer sur le premier technicien
    const firstTechOption = page.locator('[data-testid^="technician-assign-option-"]').first();
    await expect(firstTechOption).toBeVisible({ timeout: 10_000 });
    await firstTechOption.click();

    // Confirmer l'assignation
    const confirmBtn = page.locator('[data-testid="technician-assign-confirm"]');
    await expect(confirmBtn).not.toBeDisabled();
    await confirmBtn.click();

    // Vérifier que la popup se ferme et qu'un message de succès apparaît (ou que la demande disparaît)
    await expect(assignPicker).not.toBeVisible({ timeout: 10_000 });

    // --- ETAPE 3: TECHNICIEN REÇOIT LA MISSION ---

    await page.locator('[data-testid="spotlight-trigger"]').click();
    await page.locator('[data-testid="nav-item-2"]').click();
    await expect(page.locator('[data-testid="dashboard-pager-slot-2"]')).toBeVisible({
      timeout: 20_000,
    });

    await expect(page.locator('[data-testid="dashboard-pager-slot-2-panel-center"]')).toBeVisible({
      timeout: 30_000,
    });
  });
});
