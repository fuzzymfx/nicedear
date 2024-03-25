
import fs from 'fs';

export function hexToRgbA(hex: string, alpha = 1) {
	let c;
	if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
		c = hex.substring(1).split('');
		if (c.length === 3) {
			c = [c[0], c[0], c[1], c[1], c[2], c[2]];
		}
		c = '0x' + c.join('');
		return {
			r: (Number(c) >> 16) & 255,
			g: (Number(c) >> 8) & 255,
			b: Number(c) & 255,
			alpha: alpha
		};
	}
	throw new Error('Bad Hex');
}

export function file_exists(file: string): boolean {
	return fs.existsSync(file);
}