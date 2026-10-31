/*
 * The tools Ali builds with, in his words (2026-10-31): "the tools I code
 * with: React, React Native, Node.js, Figma, Illustrator." Each is already
 * on file in PROFILE.md (Skills; React Native in the Technician App PRD;
 * Illustrator is the "Adobe Suite" line). `use` says what each is for here,
 * from the work on the site: web interfaces across the missions, the
 * technician app, the APIs, the product design, Smaak.ux's brand and print.
 */

export type ToolLogo = "react" | "react-native" | "node" | "figma" | "illustrator";

export type Tool = { name: string; use: string; logo: ToolLogo };

export const toolkit: Tool[] = [
  { name: "React", use: "Web interfaces", logo: "react" },
  { name: "React Native", use: "Mobile apps", logo: "react-native" },
  { name: "Node.js", use: "APIs and services", logo: "node" },
  { name: "Figma", use: "Product design", logo: "figma" },
  { name: "Illustrator", use: "Brand and print", logo: "illustrator" },
];
