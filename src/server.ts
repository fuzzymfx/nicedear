import http from 'http';
import url from 'url';
import { api_call } from './index';
import fs from 'fs';

const PORT = process.env.PORT || 3000;

const getImageFromPath = async (path: string): Promise<Buffer> => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, (err, data) => {
			if (err) reject(err);
			else resolve(data);
		});
	});
};

const server = http.createServer(async (req, res) => {

	const requestUrl = req.url ? url.parse(req.url, true) : null;

	if (requestUrl && requestUrl.pathname === '/') {

		try {
			const seed = requestUrl.query.seed ? requestUrl.query.seed.toString() : undefined;
			const theme = requestUrl.query.theme ? requestUrl.query.theme.toString() : 'open-peeps';

			// optional query parameters
			const mirror = requestUrl.query.mirror === 'true';
			const rotate = requestUrl.query.rotate ? parseInt(requestUrl.query.rotate.toString()) : undefined;
			const background = requestUrl.query.background ? requestUrl.query.background.toString() : undefined;
			const skinColor = requestUrl.query.skincolor ? requestUrl.query.skincolor.toString() : undefined;
			const hairColor = requestUrl.query.hairColor ? requestUrl.query.hairColor.toString() : undefined;

			const scale = requestUrl.query.scale ? parseFloat(requestUrl.query.scale.toString()) : undefined;

			const transalteX
				= requestUrl.query.transalteX ? parseInt(requestUrl.query.transalteX.toString()) : undefined;
			const transalteY
				= requestUrl.query.transalteY ? parseInt(requestUrl.query.transalteY.toString()) : undefined;

			const result = await api_call(seed, theme, {
				mirror,
				rotate,
				background,
				skinColor,
				hairColor,
				scale,
				transalteX,
				transalteY
			});
			const image = await getImageFromPath(result);

			res.writeHead(200, { 'Content-Type': 'image/png' });
			res.end(image);
		} catch (error) {
			console.error(error);
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end(`An error occurred while generating the image.: ${error}`);
		}
	} else {
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end(`Invalid request.: ${req.url}`);
	}
});

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});