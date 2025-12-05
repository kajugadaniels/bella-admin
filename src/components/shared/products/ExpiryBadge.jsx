import React from "react";

function daysUntil(dateStr) {
	if (!dateStr) return null;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const target = new Date(dateStr);
	target.setHours(0, 0, 0, 0);
	return Math.ceil((target - today) / 86400000);
}

const ExpiryBadge = ({ expiryDate }) => {
	const d = daysUntil(expiryDate);
	if (d === null) return null;

	let className = "border text-xs px-2.5 py-0.5 rounded-full";
	let text = "";

	if (d <= 0) {
		className += " bg-red-100 text-red-700 border-red-200";
		text = d === 0 ? "Today" : "Expired";
	} else if (d <= 2) {
		className += " bg-red-100 text-red-700 border-red-200";
		text = `${d}d left`;
	} else if (d <= 7) {
		className += " bg-amber-100 text-amber-700 border-amber-200";
		text = `${d}d left`;
	} else {
		className += " bg-emerald-100 text-emerald-700 border-emerald-200";
		text = `${d}d left`;
	}

	return <span className={className}>{text}</span>;
};

export default ExpiryBadge;
