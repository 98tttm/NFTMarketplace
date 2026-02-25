import {
  fadeInUp,
  fadeIn,
  staggerContainer,
  scaleIn,
  slideInLeft,
  slideInRight,
  cardHover,
  pageTransition,
  popIn,
  listItem,
} from "@/lib/animations";

describe("animation variants", () => {
  it("fadeInUp has hidden and visible states", () => {
    expect(fadeInUp).toHaveProperty("hidden");
    expect(fadeInUp).toHaveProperty("visible");
    expect((fadeInUp.hidden as Record<string, number>).opacity).toBe(0);
  });

  it("fadeIn has hidden and visible states", () => {
    expect((fadeIn.hidden as Record<string, number>).opacity).toBe(0);
    expect((fadeIn.visible as Record<string, number>).opacity).toBe(1);
  });

  it("staggerContainer configures stagger children", () => {
    const visible = staggerContainer.visible as Record<string, unknown>;
    expect(visible).toHaveProperty("transition");
  });

  it("scaleIn starts scaled down", () => {
    expect((scaleIn.hidden as Record<string, number>).scale).toBeLessThan(1);
  });

  it("slideInLeft starts off-screen left", () => {
    expect((slideInLeft.hidden as Record<string, number>).x).toBeLessThan(0);
  });

  it("slideInRight starts off-screen right", () => {
    expect((slideInRight.hidden as Record<string, number>).x).toBeGreaterThan(0);
  });

  it("cardHover has rest and hover states", () => {
    expect(cardHover).toHaveProperty("rest");
    expect(cardHover).toHaveProperty("hover");
  });

  it("pageTransition has initial and animate states", () => {
    expect(pageTransition).toHaveProperty("initial");
    expect(pageTransition).toHaveProperty("animate");
  });

  it("popIn uses spring transition", () => {
    const vis = popIn.visible as Record<string, unknown>;
    const transition = vis.transition as Record<string, unknown>;
    expect(transition.type).toBe("spring");
  });

  it("listItem slides from left", () => {
    expect((listItem.hidden as Record<string, number>).x).toBeLessThan(0);
  });
});
