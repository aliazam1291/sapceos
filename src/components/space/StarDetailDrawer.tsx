"use client";

import Link from "next/link";
import Image from "next/image";
import type { GalaxyNode } from "./galaxyData";
import styles from "./InteractiveGalaxy.module.scss";

interface StarDetailDrawerProps {
  node: GalaxyNode;
  onClose: () => void;
}

export default function StarDetailDrawer({ node, onClose }: StarDetailDrawerProps) {
  return (
    <aside className={styles.drawer} aria-label={`Details for ${node.title}`}>
      <div className={styles.drawerHeader}>
        <div className={styles.drawerIdent}>
          {node.icon && (
            <Image
              src={node.icon}
              alt={`${node.title} app icon`}
              width={44}
              height={44}
              className={styles.drawerIcon}
            />
          )}
          <div>
            <h2 className={styles.drawerTitle}>{node.title}</h2>
            {node.org && <p className={styles.drawerOrg}>{node.org} &bull; {node.role}</p>}
          </div>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close detail panel">
          &times;
        </button>
      </div>

      {node.premise && <p className={styles.drawerPremise}>{node.premise}</p>}

      {node.signals && node.signals.length > 0 && (
        <div className={styles.drawerSignals}>
          {node.signals.map((sig, idx) => (
            <div key={idx} className={styles.signalRow}>
              <span className={styles.signalLabel}>{sig.label}:</span>
              <span className={styles.signalValue}>{sig.value}</span>
            </div>
          ))}
        </div>
      )}

      {node.stack && node.stack.length > 0 && (
        <div className={styles.drawerStack}>
          {node.stack.map((tech) => (
            <span key={tech} className={styles.techTag}>
              {tech}
            </span>
          ))}
        </div>
      )}

      <div className={styles.drawerActions}>
        {node.href && (
          <Link href={node.href} className={styles.actionBtn}>
            {node.isHub ? "Enter Section" : "View Mission"} &rarr;
          </Link>
        )}
        {node.storeUrl ? (
          <a
            href={node.storeUrl}
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {/* Literal glyph: JSX's entity table doesn't cover &nearr;, so it
                rendered as raw text in the button. */}
            {node.storeLabel ?? "View live"} ↗
          </a>
        ) : (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={onClose}
          >
            Zoom Out
          </button>
        )}
      </div>
    </aside>
  );
}
