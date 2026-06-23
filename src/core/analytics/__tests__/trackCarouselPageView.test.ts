import { carouselPageViewProps } from "../trackCarouselPageView";

describe("carouselPageViewProps", () => {
  it("mappe l'index 0 vers la carte", () => {
    const props = carouselPageViewProps(0, 6);
    expect(props.page_index).toBe(0);
    expect(props.page_id).toBe("map");
    expect(props.page_title).toBe("Carte");
    expect(props.profile_name).toBe("DISPATCH");
  });

  it("mappe l'index 3 vers facturation", () => {
    const props = carouselPageViewProps(3, 6);
    expect(props.page_id).toBe("billing_hub");
    expect(props.page_title).toBe("Facturation");
  });

  it("fallback pour index inconnu", () => {
    const props = carouselPageViewProps(99, 6);
    expect(props.page_id).toBe("slot_99");
  });
});
