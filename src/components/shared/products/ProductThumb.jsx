import React, { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SvgNotFound = () => (
	<svg viewBox="0 0 120 120" className="h-full w-full opacity-40">
		<rect width="120" height="120" fill="rgba(0,0,0,0.06)" />
	</svg>
);

const ProductThumb = ({ src, alt, size = 44, className = "", rounded = "rounded-xl" }) => {
	const [loaded, setLoaded] = useState(false);
	const [failed, setFailed] = useState(false);
	const showImg = !!src && !failed;

	return (
		<div
			className={`relative shrink-0 overflow-hidden border border-black/5 bg-white/60 ${rounded} ${className}`}
			style={{ width: size, height: size }}
		>
			{showImg && (
				<img
					src={src}
					alt={alt ?? "Product image"}
					className="h-full w-full object-cover"
					onLoad={() => setLoaded(true)}
					onError={() => setFailed(true)}
					draggable={false}
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
};

export default ProductThumb;
