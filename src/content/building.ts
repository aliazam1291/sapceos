/*
 * What Ali is building now (2026-10-31): the two live products the home
 * page previews. Each line is the product's own description, read off its
 * site on the day (PROFILE.md "Building now" / "Venture"), never a result:
 * neither has a measured outcome on file. The previews are full-page
 * captures of the live sites, 1440 wide, taken the same day.
 */

export type Build = {
  name: string;
  url: string;
  host: string;
  /** His part in it, in his words. */
  role: string;
  /** What it is, in the product's own words. */
  line: string;
  /** A tall capture of the live site (960 × 2100). */
  shot: string;
  /** The page on this site about it, where there is one. */
  page?: string;
  read: string;
};

export const building: Build[] = [
  {
    name: "WatchSense",
    url: "https://watchsensecrm.com/",
    host: "watchsensecrm.com",
    role: "Building it",
    line: "A retail CRM for shops, clinics and salons: automatic birthday wishes, service reminders and WhatsApp offers that bring customers back.",
    shot: "/previews/watchsense.webp",
    read: "2026-10-31",
  },
  {
    name: "DumbMoney",
    url: "https://dumbmoney.in/",
    host: "dumbmoney.in",
    role: "Founder & CPO",
    line: "A coupon and deals platform for Indian online shoppers: verified codes and cashback from Indian retailers, no signup.",
    shot: "/previews/dumbmoney.webp",
    page: "/dumbmoney",
    read: "2026-10-31",
  },
];

/** The proverb Ali works by (his words, 2026-10-31: "a quote I follow …
 *  I love this quote"), in its long form. Not attributed: the long form is
 *  commonly pinned on Shakespeare and Franklin, and neither wrote it. */
export const motto = {
  lead: "A jack of all trades is a master of none,",
  turn: "but oftentimes better than a master of one.",
};
