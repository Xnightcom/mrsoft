import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createRipple(e: React.MouseEvent<HTMLElement>) {
  const button = e.currentTarget;

  // Make sure button has relative position
  const style = window.getComputedStyle(button);
  if (style.position === "static") {
    button.style.position = "relative";
  }

  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
  circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
  circle.classList.add("ripple-element");

  const existing = button.querySelector(".ripple-element");
  if (existing) {
    existing.remove();
  }

  button.appendChild(circle);
}
