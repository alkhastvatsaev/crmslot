import { test, expect } from "@playwright/test";

test.describe("Dispatch Critical Path", () => {
  test("Complete flow: Client Request -> Backoffice Inbox -> Technician Hub", async ({ page }) => {
    // 1. Ouvrir l'application
    await page.goto("/");
    
    // Attendre que l'interface soit chargée
    await expect(page.locator('[data-testid="dashboard-pager-root"]')).toBeVisible({ timeout: 15_000 });

    // Naviguer vers la page 2 (Company Hub)
    const nextPagerBtn = page.locator('[data-testid="dashboard-pager-next"]');
    await nextPagerBtn.click();

    // Attendre le chargement du Company Hub
    await expect(page.locator('[data-testid="requester-intervention-panel"]')).toBeVisible({ timeout: 15_000 });

    // --- ETAPE 1: CLIENT SOUMET UNE DEMANDE ---
    
    // Remplissage du profil (Rail gauche)
    await page.locator('[data-testid="requester-type-particulier"]').click();
    const profilePanel = page.locator('[data-testid="requester-profile-panel"]');
    await profilePanel.locator('input[type="text"]').nth(0).fill("Jean");
    await profilePanel.locator('input[type="text"]').nth(1).fill("Dupont");
    await profilePanel.locator('input[type="tel"]').fill("0470123456");
    await profilePanel.locator('input[type="text"]').nth(2).fill("Rue de la Loi 16, Bruxelles");

    // Formulaire d'intervention (Rail central)
    const interventionPanel = page.locator('[data-testid="requester-intervention-panel"]');
    
    // Etape 0: Choix du problème (clic sur le premier template)
    await interventionPanel.locator('button').nth(0).click();

    // Etape 1: Description
    await interventionPanel.locator('textarea').fill("Fuite d'eau importante sous l'évier.");
    const nextBtn = page.locator('button[aria-label="Étape suivante"], button[aria-label="Volgende stap"], button[aria-label="Next step"]');
    await nextBtn.click(); // Vers Etape 2

    // Etape 2: Photos (Required!)
    await expect(interventionPanel.locator('input[type="file"]')).toBeAttached({ timeout: 10_000 });
    const fileInput = interventionPanel.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    });
    // Attendre que la photo s'affiche (on attend qu'il n'y ait plus l'état vide pour la première case)
    await page.waitForTimeout(1000);
    await nextBtn.click(); // Vers Etape 3

    // Etape 3: Horaires
    // Attendre que le composant charge les créneaux
    await page.waitForTimeout(1000); 
    // Sélectionner le premier créneau horaire disponible (ça va auto-avancer vers Etape 4)
    const timeSlot = page.locator('button').filter({ hasText: /([0-1]?[0-9]|2[0-3]):[0-5][0-9]/ }).first();
    await expect(timeSlot).toBeVisible({ timeout: 10_000 });
    await timeSlot.click(); // Vers Etape 4

    // Etape 4: Soumission (Adresse + Bouton)
    await page.waitForTimeout(1000);
    const addressInput = interventionPanel.locator('[data-testid="smart-form-address"]');
    await expect(addressInput).toBeVisible({ timeout: 5000 });
    await addressInput.fill("Rue de la Loi 16, Bruxelles");
    await page.keyboard.press("Escape"); // Fermer l'autocomplete
    
    const submitBtn = interventionPanel.locator('button').filter({ hasText: /Envoyer la demande|Verzoek indienen|Submit request/i });
    await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
    await submitBtn.click();

    // Vérifier le succès (Toast de succès)
    await expect(page.locator('text=/enregistrée|opgeslagen|saved/i')).toBeVisible({ timeout: 15_000 });

    // --- ETAPE 2: BACKOFFICE REÇOIT ET ASSIGNE ---
    
    // Retour au Dashboard principal (Page 1)
    const prevPagerBtn = page.locator('[data-testid="dashboard-pager-prev"]');
    await prevPagerBtn.click();

    // La demande doit atterrir dans l'Inbox BackOffice (Rail de droite)
    // On passe sur l'onglet "Demandes" (par défaut c'est le Chat)
    await page.locator('button').filter({ hasText: /Demandes|Requests|Aanvragen/i }).click();

    // On prend la carte qui correspond à notre description
    const requestCard = page.locator('[data-testid^="backoffice-inbox-request-row-"]')
      .filter({ hasText: "Fuite d'eau importante" }).first();
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
    
    // Le panneau backoffice auto-navigue vers la vue Technicien (Page 3 du carousel, index 2)
    // Vérifier qu'on est sur le Hub Technicien en cherchant la liste des missions
    await expect(page.locator('[data-testid="technician-dashboard-list"]')).toBeVisible({ timeout: 10_000 });

    // La mission assignée doit apparaître comme offre d'assignation
    // On va chercher la première carte
    const offerCard = page.locator('[data-testid^="technician-assignment-offer-"]').first();
    await expect(offerCard).toBeVisible({ timeout: 15_000 });
    
    // Accepter la mission
    const acceptBtn = offerCard.locator('[data-testid="technician-assignment-accept"]');
    await expect(acceptBtn).toBeVisible({ timeout: 15_000 });
    await acceptBtn.click();
  });
});
