import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let ctx: gsap.Context | undefined;

function init() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  ctx = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        autoAlpha: 0,
        y: 40,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });
  });
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
  ctx?.revert();
  ctx = undefined;
});
