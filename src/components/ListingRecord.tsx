import type { Mission } from "@/content/types";
import styles from "./ListingRecord.module.scss";

/**
 * The public record behind a live link, on a mission report (2026-10-29):
 * what the store listing itself shows — installs, rating, last update —
 * with where it came from and the day it was read. These are the listing's
 * numbers, not outcomes claimed for the work, and the line says so by
 * construction: source first, date last.
 */
export default function ListingRecord({ listing }: { listing: NonNullable<Mission["listing"]> }) {
  const read = new Date(`${listing.read}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <div className={styles.record} aria-label={`Public listing on ${listing.where}`}>
      <span className={styles.where}>Public record · {listing.where}</span>
      <dl className={styles.facts}>
        {listing.installs ? (
          <div>
            <dt>Installs</dt>
            <dd>{listing.installs}</dd>
          </div>
        ) : null}
        {listing.rating ? (
          <div>
            <dt>Rating</dt>
            <dd>
              {listing.rating}
              <span aria-hidden="true">★</span>
              {listing.reviews ? <span className={styles.sub}> · {listing.reviews} reviews</span> : null}
            </dd>
          </div>
        ) : null}
        {listing.updated ? (
          <div>
            <dt>Last update</dt>
            <dd>{listing.updated}</dd>
          </div>
        ) : null}
      </dl>
      <a className={styles.open} href={listing.href} target="_blank" rel="noreferrer noopener">
        Open the listing <span aria-hidden="true">↗</span>
      </a>
      <span className={styles.read}>Read {read}</span>
    </div>
  );
}
