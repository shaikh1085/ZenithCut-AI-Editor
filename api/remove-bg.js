export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const HF_KEY = process.env.HUGGINGFACE_API_KEY;
    if (!HF_KEY) return res.status(500).json({ error: 'API key not configured' });

    try {
        const { imageBase64 } = req.body;
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // Fetch with a timeout signal
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 sec timeout

        const response = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_KEY}`,
                'Content-Type': 'application/octet-stream',
                'x-wait-for-model': 'true'
            },
            body: imageBuffer,
            signal: controller.signal
        });
        
        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: 'HF API Error', details: errorText });
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Result = Buffer.from(arrayBuffer).toString('base64');
        
        return res.status(200).json({ image: `data:image/png;base64,${base64Result}` });

    } catch (error) {
        console.error("CRITICAL NETWORK ERROR:", error.message);
        return res.status(500).json({ error: "Network Error: Could not connect to API. Please retry." });
    }
}
