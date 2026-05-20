const https = require('https');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const HF_KEY = process.env.HUGGINGFACE_API_KEY;
    if (!HF_KEY) return res.status(500).json({ error: 'API key not configured' });

    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // Use node-fetch compatible approach
        const result = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'api-inference.huggingface.co',
                path: '/models/briaai/RMBG-1.4',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_KEY}`,
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': imageBuffer.length,
                    'x-wait-for-model': 'true',
                }
            };

            const chunks = [];
            const request = https.request(options, (response) => {
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    resolve({
                        status: response.statusCode,
                        headers: response.headers,
                        body: Buffer.concat(chunks)
                    });
                });
            });

            request.on('error', reject);
            request.write(imageBuffer);
            request.end();
        });

        console.log('HF Status:', result.status);
        console.log('HF Content-Type:', result.headers['content-type']);

        if (result.status !== 200) {
            const errText = result.body.toString();
            console.log('HF Error body:', errText.substring(0, 300));
            return res.status(result.status).json({
                error: `HuggingFace error ${result.status}`,
                details: errText.substring(0, 300),
                retry: result.status === 503
            });
        }

        const base64Result = result.body.toString('base64');
        return res.status(200).json({
            image: `data:image/png;base64,${base64Result}`
        });

    } catch (error) {
        console.error('Handler error:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
