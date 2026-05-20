export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const HF_KEY = process.env.HUGGINGFACE_API_KEY;

    try {
        const { imageBase64 } = req.body;
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        const response = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_KEY}`,
                'Content-Type': 'application/octet-stream',
                'x-wait-for-model': 'true'
            },
            body: imageBuffer
        });

        // Yahan se error details capture hogi
        if (!response.ok) {
            const errorText = await response.text();
            console.error('--- HUGGING FACE ERROR ---');
            console.error('Status:', response.status);
            console.error('Body:', errorText);
            return res.status(response.status).json({ error: 'HF Error', details: errorText });
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Result = Buffer.from(arrayBuffer).toString('base64');
        
        return res.status(200).json({ image: `data:image/png;base64,${base64Result}` });

    } catch (error) {
        console.error('--- CODE CRASH ERROR ---', error);
        return res.status(500).json({ error: error.message });
    }
}
