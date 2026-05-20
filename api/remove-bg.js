export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

        const imageBuffer = Buffer.from(imageBase64, 'base64');

        const HF_KEY = process.env.HUGGINGFACE_API_KEY;
        if (!HF_KEY) return res.status(500).json({ error: 'API key not configured' });

        // Call Hugging Face RMBG-1.4 model
        const response = await fetch(
            'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_KEY}`,
                    'Content-Type': 'application/octet-stream',
                },
                body: imageBuffer,
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            // Model loading (cold start) — tell frontend to retry
            if (response.status === 503) {
                return res.status(503).json({ error: 'Model is loading, please retry in 20 seconds', retry: true });
            }
            throw new Error(`HuggingFace error ${response.status}: ${errText}`);
        }

        const resultBuffer = await response.arrayBuffer();
        const base64Result = Buffer.from(resultBuffer).toString('base64');

        return res.status(200).json({ image: `data:image/png;base64,${base64Result}` });

    } catch (error) {
        console.error('Remove BG Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
