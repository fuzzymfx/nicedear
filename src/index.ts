import Sharp, { OverlayOptions, SharpOptions } from 'sharp';
import path from 'path';
import fs from 'fs';
import potrace from 'potrace';

import {
	getFilesInDir, isPathImage,
	readSeed, file_exists, hexToRgbA
} from './utils';

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

interface Params {
	mirror?: boolean;
	rotate?: number;
	background?: string;
	skinColor?: string;
	hairColor?: string;
	scale?: number;
	transalteX?: number;
	transalteY?: number;
	features?: string[];
	// Add other properties if needed
}

// The path of a directory that leads to a feature. Eg - './assets/head/'
export type FeaturePath = string;
// The name of a feature. Eg - 'face', 'facial-hair', 'head'
export type FeatureName = string;



// Data required to load feature from disk
export type FeatureLoadData = {
	name: string;
	dir: string;
	top?: number;
	left?: number;
};

/**
 * Load features from the filesystem.
 * @param featureData An array of `FeatureLoadDatas` where each contains the name and directory path of a feature.
 * The array is assumed to be ordered by the desired z-index of the features.
 * @returns features A list of features corresponding to the argument.
 */
async function loadFeatures(
	featureData: FeatureLoadData[]
): Promise<Feature[]> {
	async function loadFeature(
		fdata: FeatureLoadData,
		zIndex: number
	): Promise<Feature> {
		const filesInDir = await getFilesInDir(fdata.dir);
		const imagesInDir = filesInDir.filter(isPathImage);
		return {
			name: fdata.name,
			zIndex,
			choices: imagesInDir,
			top: fdata.top,
			left: fdata.left,
		};
	}

	const features = featureData.map((fdata, zIndex) =>
		loadFeature(fdata, zIndex)
	);

	return Promise.all(features);
}

/**
 * Load features from a directory.
 * @param theme The theme of the feature set to load.
 * @returns features The feature list for the theme from the filesystem.
 */
async function loadFeaturesFromDir(theme?: string, requiredFeatures?: Array<string>): Promise<Feature[]> {
	let assetsDir: string;
	if (!theme) {
		assetsDir = path.join(__dirname, 'assets', 'open-peeps');
	} else {
		assetsDir = path.join(__dirname, 'assets', theme);
	}
	let featureData: FeatureLoadData[] = [];
	if (!requiredFeatures || requiredFeatures.length === 0) {
		featureData = [
			{ name: 'head', dir: path.join(assetsDir, 'head') },
			{ name: 'face', dir: path.join(assetsDir, 'face'), top: 375, left: 400 },
		];
	} else {
		if (requiredFeatures.includes('head')) {
			featureData.push({ name: 'head', dir: path.join(assetsDir, 'head') });
		}

		if (requiredFeatures.includes('face')) {
			featureData.push({ name: 'face', dir: path.join(assetsDir, 'face'), top: 375, left: 400 });
		}

		if (requiredFeatures.includes('facialHair')) {
			featureData.push({
				name: 'facialHair',
				dir: path.join(assetsDir, 'facial-hair'),
				top: 515,
				left: 360,
			});
		}
	}

	const features = await loadFeatures(featureData);
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

	const hash = Math.abs(hashString(seed));
	return features.map((feature) => {
		const index = hash % feature.choices.length;
		return feature.choices[index];
	});
}

/**
 * 
 * @param image: A sharp instance of the image to be transformed.
 * @param params: The parameters to use for image transformation.
 * @returns The transformed image.
 */

async function applyTransformations(path: string, params?: Params): Promise<string> {
  if (params?.mirror) {
    const outputPath = path.replace('.png', '_mirrored.png');
    await Sharp(path).flop().toFile(outputPath);
		fs.unlinkSync(path);
		fs.renameSync(outputPath, path);
  }

	if(params?.rotate) {
    const outputPath = path.replace('.png', '_rotated.png');
    await Sharp(path)
        .rotate(params.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(outputPath);
    fs.unlinkSync(path);
    fs.renameSync(outputPath, path);
	}

	if(params?.scale) {
		const outputPath = path.replace('.png', '_scaled.png');
		await Sharp(path).resize({ width: 1000 * params.scale, height: 1000 * params.scale }).toFile(outputPath);
		fs.unlinkSync(path);
		fs.renameSync(outputPath, path);
	}

	await new Promise<void>((resolve, reject) => {
    potrace.trace(path, function(err, svgString) {
      if (err) reject(err);
      fs.writeFileSync(path.replace('.png', '.svg'), svgString);
      console.log('SVG file created');
      resolve();
    });
  });

  return path.replace('.png', '.svg');
}

/**
 * 
 * @param pathHash: A hash generated from the seed, theme and params, used to name the output file.
 * @param seed: A string of any length.
 * @param theme: The theme of the feature set to use.
 * @param params: The parameters to use for image generation.
 */

async function buildImage(pathHash: number, seed: string, theme?: string, params?: Params): Promise<string> {
	const requiredFeatures = params?.features;
	const features = await loadFeaturesFromDir(theme, requiredFeatures);

	// specific image paths generated from the seed
	const imagePaths = generateImagePathsFromSeed(features, seed);

	// add image paths to layers to create the final image
	const layers: OverlayOptions[] = await Promise.all(imagePaths.map(async (imgPath, i) => {
		const feature = features[i];
		const layer: OverlayOptions = { input: imgPath };
		if (feature.top) layer.top = feature.top;
		if (feature.left) layer.left = feature.left;
		return layer;
	}));

	const transparentBackground: SharpOptions = {
		create: {
			width: 1000,
			height: 1000,
			channels: 4,
			background: { r: 255, g: 255, b: 255, alpha: 0 }
		},
	};
		await Sharp(transparentBackground).composite(layers).png().toFile(`_output/${seed}${pathHash}.png`);
		return await applyTransformations(`_output/${seed}${pathHash}.png`, params);
}


/**
 * @param argSeed The seed passed as an argument to the program.
 * @param theme The theme of the feature set to use.
 * @param params The parameters to use for image generation.
 * @returns The path to the generated image.
 */
export async function api_call(argSeed?: string, theme?: string, params?: Params): Promise<string> {
	// sync output directory; create if it doesn't exist
	const outputDirectory = '_output';
	fs.mkdirSync(path.resolve(outputDirectory), { recursive: true });

	const paramsString = JSON.stringify(params).replace(/[{}":]/g, '');

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

	const pathHash = Math.abs(hashString(`${argSeed}_${theme}_${paramsString}`));

	// return existing file 
	if (file_exists(`_output/${argSeed}${pathHash}.svg`)) {
		console.log(`File exists: _output/${argSeed}${pathHash}.svg`);
		return `_output/${argSeed}${pathHash}.svg`;
	}

	console.log(`Creating: _output/${argSeed}${pathHash}.svg`);
	const seedString = argSeed || Math.random().toString(36).substring(7) + Math.random().toString(36).substring(7);
	const seed = readSeed(seedString);

	return await buildImage(pathHash, seed, theme, params);
}

async function main() {
	const argSeed = process.argv[2];
	const theme = process.argv[3];
	const params: Params = {
		mirror: process.argv[4] === 'true',
		rotate: parseInt(process.argv[5]),
		background: process.argv[6],
		skinColor: process.argv[7],
		hairColor: process.argv[8],
		scale: parseFloat(process.argv[9]),
		transalteX: parseFloat(process.argv[10]),
		transalteY: parseFloat(process.argv[11]),
		features: process.argv[12] ? process.argv[12].split(',') : undefined
	};

	try {
		await api_call(argSeed, theme, params);
	} catch (error) {
		console.error(error);
	}
}

if (require.main === module) {
	main().catch(console.error);
}