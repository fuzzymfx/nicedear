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
			const result = await api_call(seed);
			const image = await getImageFromPath(result);

			res.writeHead(200, { 'Content-Type': 'image/png' });
			res.end(image);
		} catch (error) {
			console.error(error);
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end('An error occurred while generating the image.');
		}
	} else {
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end('Invalid request.');
	}
});

server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});