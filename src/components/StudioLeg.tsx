import Link from "next/link";
import Comms from "./Comms";
import DomeGallery from "./smaak/DomeGallery";
import { gallery } from "@/content/gallery";
import { Section, SectionHead } from "./ui";
import { studio } from "@/content/studio";
import styles from "./StudioLeg.module.scss";

/*
 * Design, on the home page (05 since the 2026-10-31 flow).
 *
 * Smaak.ux was invisible from the front door; the dome hangs the design
 * work where it can be seen at a glance, and the leg hands off to the
 * studio. The four hologram projectors that sat under the dome went with
 * the flow simplification — they repeated four of the dome's pieces, and
 * /studio projects all sixteen.
 */
export default function StudioLeg() {
  return (
    <Section id="studio" data-section="Design">
      <SectionHead
        label={`05 / Design · ${studio.name} · since ${studio.since}`}
        title="The studio on the side"
        action={
          <Link href="/studio" className={styles.all}>
            The studio &rarr;
          </Link>
        }
      />
      <Comms at="studioLeg" className={styles.comms} />
      {/*
        * The gallery (2026-09-27). Ali: "I need a gallery section on main
        * home page and smaak.ux." The dome shows fourteen pieces where the
        * projectors below used to show four — it is the design work at a
        * glance. The dome's frames are holograms (2026-09-30), lit in true
        * colour only when pointed at.
        */}
      <DomeGallery items={gallery.slice(0, 10)} />

    </Section>
  );
}
