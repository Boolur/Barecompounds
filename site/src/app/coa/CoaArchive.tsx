"use client";

import { useMemo, useState } from "react";
import type { CoaRecord } from "@/lib/commerce";

export default function CoaArchive({ records }: { records: CoaRecord[] }) {
  const [query, setQuery] = useState("");
  const visibleRecords = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return records;
    return records.filter((record) =>
      `${record.batchNumber} ${record.productName} ${record.sizeLabel}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, records]);

  return (
    <section className="container-bare pb-24 md:pb-32">
      <label className="block border-y border-[var(--bare-rule)] py-6">
        <span className="eyebrow">Search certificates</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Batch number or compound"
          className="mt-4 w-full bg-transparent font-serif text-3xl outline-none placeholder:text-taupe md:text-5xl"
        />
      </label>

      {visibleRecords.length ? (
        <ul className="divide-y divide-[var(--bare-rule)] border-b border-[var(--bare-rule)]">
          {visibleRecords.map((record) => (
            <li key={`${record.batchNumber}-${record.url}`}>
              <a
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid gap-4 py-7 transition-colors hover:bg-paper md:grid-cols-[1.2fr_2fr_1fr_auto] md:items-center md:px-5"
                aria-label={`Open Certificate of Analysis for ${record.productName}, batch ${record.batchNumber}`}
              >
                <span className="font-mono text-sm">{record.batchNumber}</span>
                <span className="font-serif text-2xl">{record.productName}</span>
                <span className="caption">{record.sizeLabel}</span>
                <span className="caption text-right">
                  Received {new Date(record.receivedAt).toLocaleDateString()}
                  <span aria-hidden> ↗</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-b border-[var(--bare-rule)] py-16">
          <p className="eyebrow">{query ? "No matching certificates" : "Archive empty"}</p>
          <h2 className="display-s mt-5">
            {query ? "Try another batch or compound." : "No public COAs are available yet."}
          </h2>
          <p className="lede mt-5 max-w-[52ch]">
            {query
              ? "Check the batch number printed on the product label and search again."
              : "Certificates will appear here after a batch is published with an approved document."}
          </p>
        </div>
      )}
    </section>
  );
}
