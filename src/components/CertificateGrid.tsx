"use client";

import Image from "next/image";
import { useState } from "react";
import type { certifications } from "@/content/profile";
import styles from "./CertificateGrid.module.scss";

type Certificate = (typeof certifications)[number];

export default function CertificateGrid({ items }: { items: Certificate[] }) {
  const [active, setActive] = useState(0);
  const certificate = items[active];
  return <div className={styles.shell}><div className={styles.rail} role="tablist" aria-label="Certificates">{items.map((item, index) => <button key={item.name} type="button" role="tab" aria-selected={index === active} className={styles.tab} onClick={() => setActive(index)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong><em>{item.issuer} / {item.date}</em></button>)}</div><article className={styles.preview} aria-live="polite"><div className={styles.geometry} aria-hidden="true"><i /><b /><span /></div>{certificate.image ? <Image key={certificate.image} className={styles.image} src={certificate.image} alt={`${certificate.name} certificate from ${certificate.issuer}`} width={900} height={650} sizes="(max-width: 900px) 100vw, 48vw" /> : <div className={styles.placeholder}><span>Verified credential</span><strong>{certificate.issuer}</strong></div>}<div className={styles.caption}><span>Credential / {String(active + 1).padStart(2, "0")}</span><strong>{certificate.name}</strong></div></article></div>;
}
