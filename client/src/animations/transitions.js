import { gsap } from "./gsap";

export const fadeInUp = (element, delay = 0) => {
  if (!element) return;

  gsap.fromTo(
    element,
    {
      opacity: 0,
      y: 40,
    },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay,
      ease: "power3.out",
    }
  );
};

export const fadeIn = (element, delay = 0) => {
  if (!element) return;

  gsap.fromTo(
    element,
    {
      opacity: 0,
    },
    {
      opacity: 1,
      duration: 0.8,
      delay,
      ease: "power2.out",
    }
  );
};