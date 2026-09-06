import type { LabEntry } from "./types";

// Experiments and independent builds. Facts from PROFILE.md only.

export const labEntries: LabEntry[] = [
  {
    title: "D3 Advanced Visuals",
    premise:
      "An enterprise analytics platform built in the open — reusable chart components that survive contact with real data and two themes.",
    stack: ["D3.js", "Next.js", "TypeScript"],
    status: "open-source",
  },
  {
    title: "Handwritten Text Recognition",
    premise:
      "An OCR pipeline where most of the work happens before the model does — preprocessing decides what recognition even gets a chance at.",
    stack: ["OpenCV", "Tesseract", "Python"],
    status: "prototype",
  },
  {
    title: "PUJ Obstruction Detection",
    premise:
      "A deep-learning pipeline over ultrasound data. Medical imaging punishes confident models with thin evidence.",
    stack: ["Python", "TensorFlow", "Deep learning"],
    status: "prototype",
  },
  {
    title: "Carbon Footprint Calculator",
    premise:
      "Electricity-based emissions estimation, with offsets visualised — a number nobody feels, made into something they can see.",
    stack: ["JavaScript", "Data visualisation"],
    status: "prototype",
  },
];
