export function appendTrustedSvg(parent: HTMLElement, svgString: string): void {
	const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
	if (doc.querySelector('parsererror')) return;

	parent.appendChild(document.importNode(doc.documentElement, true));
}
