import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ProductThumb
 * - lazy-loads <img>
 * - shows a Skeleton while loading
 * - falls back to a simple SVG placeholder when no image or load fails
 */
function SvgNotFound({ label = "Image not found" }) {
    return (
        <svg viewBox="0 0 120 120" role="img" aria-label={label} className="h-full w-full">
            <defs>
                <linearGradient id="nfGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(0,0,0,0.05)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
                </linearGradient>
            </defs>
            <rect width="120" height="120" fill="url(#nfGrad)" />
            <g opacity="0.35" transform="translate(30,30)">
                <path
                    d="M52 8H8a8 8 0 0 0-8 8v44a8 8 0 0 0 8 8h44a8 8 0 0 0 8-8V16a8 8 0 0 0-8-8Zm-6 36-8-10-12 16-8-10-10 14v4h48v-6l-10-8Z"
                    fill="currentColor"
                />
            </g>
            <text
                x="60"
                y="102"
                textAnchor="middle"
                fontSize="10"
                fill="currentColor"
                opacity="0.55"
                style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" }}
            >
                Image not found
            </text>
        </svg>
    );
}

export default function ProductThumb({ src, alt, size = 44, rounded = "rounded-xl", className = "" }) {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    const showImg = !!src && !failed;

    return (
        <div
            className={[
                "relative shrink-0 overflow-hidden border border-black/5 bg-white/70",
                rounded,
                className,
            ].join(" ")}
            style={{ width: size, height: size }}
        >
            {showImg && (
                <img
                    src={src}
                    alt={alt || "Product image"}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    referrerPolicy="no-referrer"
                    onLoad={() => setLoaded(true)}
                    onError={() => setFailed(true)}
                    className="h-full w-full object-cover"
                />
            )}

            {!showImg && <SvgNotFound />}

            {showImg && !loaded && (
                <div className="absolute inset-0">
                    <Skeleton className="h-full w-full" />
                </div>
            )}
        </div>
    );
}
