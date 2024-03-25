import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

export type ImageExt = 'svg' | 'jpg' | 'png' | 'jpeg';
const SupportedExtensions: Set<string> = new Set([
	'.svg',
	'.jpg',
	'.png',
	'.jpeg',
]);

const asyncReadDir = promisify(fs.readdir);
const asyncStat = promisify(fs.stat);

/**
 * 
 * @param hex a hex color
 * @param alpha an alpha value
 * @returns an object with the r, g, b, and alpha values of the color
 */
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

/**
 * 
 * @param file a file path
 * @returns `true` if the file exists
 */
export function file_exists(file: string): boolean {
	return fs.existsSync(file);
}

/**
 * @param defaultSeed a default value that is returned when no seed is passed as argument
 * @return seed A seed passed in the command line, or the default seed if none provided.
 */
export function readSeed(defaultSeed: string): string {
	const args = process.argv;
	if (args.length > 2) return args[2];
	return defaultSeed;
}

/**
 * @param path_ Path to a file or directory.
 * @returns `true` if the path is that of a file.
 */
export async function isFile(path_: fs.PathLike): Promise<boolean> {
	const stat = await asyncStat(path_);
	return stat.isFile();
}

/**
 * @param dirpath path to a directory.
 * @returns list containing all files in that directory.
 */
export async function getFilesInDir(dirpath: string): Promise<string[]> {
	const itemsInDir = (await asyncReadDir(dirpath)).map((fpath) =>
		path.join(dirpath, fpath)
	);

	const filesInDir: string[] = [];
	for (const dirItem of itemsInDir) {
		if (await isFile(dirItem)) {
			filesInDir.push(dirItem);
		}
	}

	return filesInDir;
}

/**
 * @param filePath Path to a file that might be an image.
 * @returns `true` if the path is that of an image.
 */
export function isPathImage(filePath: string): boolean {
	const ext = path.extname(filePath);
	return SupportedExtensions.has(ext) || SupportedExtensions.has(`.${ext}`);
}