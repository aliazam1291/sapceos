"use client";

import dynamic from "next/dynamic";
import Hologram from "./Hologram";
import Scene3D from "./Scene3D";
import { ui } from "./ui";

const MissionObject = dynamic(() => import("./MissionObject"), {
  ssr: false,
  loading: () => null,
});

/**
 * The report's opening frame.
 *
 * With a cover: the real screenshot fills the frame, duotoned into the
 * palette, and the mission's 3D form sits over its right edge as the seal.
 * Without one (the active missions, which have nothing shippable to show
 * yet): the form has the frame to itself, as before.
 */
export default function ReportHero({
  seed,
  title,
  cover,
}: {
  seed: string;
  title: string;
  cover?: string;
}) {
  return (
    <div className={ui.reportObject} data-cover={cover ? "" : undefined}>
      {cover ? (
        <div className={ui.reportHolo} aria-hidden="true">
          <Hologram src={cover} seed={seed} tag="REPORT" alt={`${title} — interface`} />
        </div>
      ) : null}
      <Scene3D
        label={`A slowly rotating wireframe form with an emerald ring, generated as the visual identity for the ${title} mission.`}
        className={cover ? ui.reportObjectSeal : ui.reportObjectLayer}
      >
        <MissionObject seed={seed} />
      </Scene3D>
      <span className={ui.reportObjectCaption}>
        {cover ? `${title} · shipped interface` : `Mission form · ${seed}`}
      </span>
    </div>
  );
}
