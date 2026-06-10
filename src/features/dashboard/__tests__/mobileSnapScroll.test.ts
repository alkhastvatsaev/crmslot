import { scrollSnapStripToCenter } from "@/features/dashboard/mobileSnapScroll";

describe("scrollSnapStripToCenter", () => {
  it("centre le slot demandé via getBoundingClientRect", () => {
    const strip = {
      scrollLeft: 0,
      scrollWidth: 900,
      getBoundingClientRect: () => ({ left: 0, width: 390 }),
      children: [
        { getBoundingClientRect: () => ({ left: 10, width: 338 }) },
        { getBoundingClientRect: () => ({ left: 358, width: 338 }) },
        { getBoundingClientRect: () => ({ left: 706, width: 338 }) },
      ],
    } as unknown as HTMLElement;

    scrollSnapStripToCenter(strip, 1);
    expect(strip.scrollLeft).toBe(332);
  });
});
