const https = require('https');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const HF_KEY = process.env.HUGGINGFACE_API_KEY;

    try {
        const { imageBase64 } = req.body;
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // DNS error se bachne ke liye options
        const options = {
            hostname: 'api-inference.huggingface.co',
            path: '/models/briaai/RMBG-1.4',
            method: 'POST',
            family: 4, // <-- Yeh line DNS resolution ko fix karti hai
            headers: {
                'Authorization': `Bearer ${HF_KEY}`,
                'Content-Type': 'application/octet-stream',
                'x-wait-for-model': 'true'
            }
        };

        const result = await new Promise((resolve, reject) => {
            const reqH = https.request(options, (resH) => {
                let data = [];
                resH.on('data', chunk => data.push(chunk));
                resH.on('end', () => {
                    resolve({
                        status: resH.statusCode,
                        body: Buffer.concat(data)
                    });
                });
            });

            reqH.on('error', (err) => reject(err));
            reqH.write(imageBuffer);
            reqH.end();
        });

        if (result.status !== 200) {
            return res.status(result.status).json({ error: 'HF Error', details: result.body.toString() });
        }

        return res.status(200).json({ 
            image: `data:image/png;base64,${result.body.toString('base64')}` 
        });

    } catch (error) {
        console.error('CRITICAL DNS/NETWORK ERROR:', error);
        return res.status(500).json({ error: error.message });
    }
}
