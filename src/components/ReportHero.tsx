"use client";

import dynamic from "next/dynamic";
import Scene3D from "./Scene3D";
import { ui } from "./ui";

const MissionObject = dynamic(() => import("./MissionObject"), {
  ssr: false,
  loading: () => null,
});

export default function ReportHero({ seed, title }: { seed: string; title: string }) {
  return (
    <div className={ui.reportObject}>
      <Scene3D
        label={`A slowly rotating wireframe form with a teal ring, generated as the visual identity for the ${title} mission.`}
        className={ui.reportObjectLayer}
      >
        <MissionObject seed={seed} />
      </Scene3D>
      <span className={ui.reportObjectCaption}>Mission form · {seed}</span>
    </div>
  );
}
