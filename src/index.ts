import Sharp, { OverlayOptions, SharpOptions } from 'sharp';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';


// Data required when loading a data from disk
export type FeatureLoadData = {
  name: string;
  dir: string;
  top?: number;
  right?: number;
}

// A 'Feature' is a portion of the image.
// A feature can be a face, the eyes etc.
export type Feature = {
	// E.g - 'ears', 'eyes', 'head', etc.
	name: string;
	// The z-index of a feature determines whether it will be rendered above or below
	// another feature. For example - a feature with z-index 0 will always be displayed
	// below a feature with z-index 1.
	// E.g - The z-index of 'head' should be less than that of 'hair'
	zIndex: number;

	// A list of filepaths, each representing a file containing a possible choice
	// for a feature. E.g - ['eyes-1.svg', 'assets/eyes-2.svg']
	choices: string[];

	// Offset from top of canvas
	top?: number;

	// Offset from left side of canvas
	left?: number;
};

// The path of a directory that leads to a feature. Eg - './assets/head/'
export type FeaturePath = string;
// The name of a feature. Eg - 'face', 'facial-hair', 'head'
export type FeatureName = string;

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
 * @param path_ Path to a file or directory.
 * @returns `true` if the path is that of a file.
 */
async function isFile(path_: fs.PathLike): Promise<boolean> {
	const stat = await asyncStat(path_);
	return stat.isFile();
}

/**
 * @param dirpath path to a directory.
 * @returns list containing all files in that directory.
 */
async function getFilesInDir(dirpath: string): Promise<string[]> {
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
function isPathImage(filePath: string): boolean {
	const ext = path.extname(filePath);
	return SupportedExtensions.has(ext) || SupportedExtensions.has(`.${ext}`);
}

/**
 * Load features from the filesystem.
 * @param featurePaths An array where each entry is of the form [featureName, featureDirPath] where `featureName`
 * represents the name of the feature and `featureDirPath` represents the directory path where the assets of that feature are located.
 * The array is assumed to be ordered by the desired z-index of the features.
 * @returns features A list of features corresponding to the argument.
 */
async function loadFeatures(
	featurePaths: [FeatureName, FeaturePath][]
): Promise<Feature[]> {
	async function loadFeature(
		name: string,
		dirPath: string,
		zIndex: number
	): Promise<Feature> {
		const filesInDir = await getFilesInDir(dirPath);
		const imagesInDir = filesInDir.filter(isPathImage);
		return {
			name,
			zIndex,
			choices: imagesInDir,
		};
	}

	const features = featurePaths.map(([fname, fpath], zIndex) =>
		loadFeature(fname, fpath, zIndex)
	);

	return Promise.all(features);
}

/**
 * Load features from the open-peeps image set.
 * @return features The feature list for the open peeps dataset from the filesystem.
 */
async function loadOpenPeeps(): Promise<Feature[]> {
	const assetsDir = path.join(__dirname, 'assets');
	const dirsOfPart: [string, string][] = [
		['head', path.join(assetsDir, 'head')],
		['face', path.join(assetsDir, 'face')],
		['facialHair', path.join(assetsDir, 'facial-hair')],
	];
	const features = await loadFeatures(dirsOfPart);
	return features;
}

/**
 * @param features an array of features sorted by z-index.
 * @param seed a string of any length
 * @return paths A list of file paths, each representing a path to a selected image for that feature.
 */
export function generateImagePathsFromSeed(
	features: Feature[],
	seed: string
): string[] | never {
	// Refactored version of a simple hash function taken from here:
	// https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
	const hashString = (s: string): number => {
		let hash = 0;
		if (s.length === 0) return hash;
		for (let i = 0; i < s.length; i++) {
			const chr = s.charCodeAt(i);
			hash = (hash << 5) - hash + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	};

	const hash = hashString(seed);
	return features.map((feature) => {
		const index = hash % feature.choices.length;
		return feature.choices[index];
	});
}

/**
 * @param defaultSeed a default value that is returned when no seed is passed as argument
 * @return seed A seed passed in the command line, or the default seed if none provided.
 */
function readSeed(defaultSeed: string): string {
	const args = process.argv;
	if (args.length >= 2) return args[2];
	return defaultSeed;
}

async function main() {
	const features = await loadOpenPeeps();
	const seed = readSeed('default-seed');
	const imagePaths = generateImagePathsFromSeed(features, seed);
	const layers: OverlayOptions[] = imagePaths.map((imgPath) => {
		return { input: imgPath };
	});

	layers[2].left = 130;
	layers[2].top = 320;

	const background: SharpOptions = {
		create: {
			width: 600,
			height: 600,
			channels: 4,
			background: { r: 255, g: 255, b: 255, alpha: 1 },
		},
	};

	Sharp(background).composite(layers).png().toFile('_output/bar.png');
}

main().catch(console.error);

