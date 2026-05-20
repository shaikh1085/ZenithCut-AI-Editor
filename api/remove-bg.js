export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const HF_KEY = process.env.HUGGINGFACE_API_KEY;
    
    // Debugging: Check if API key is actually loaded in the server environment
    if (!HF_KEY) {
        console.error("Critical: HUGGINGFACE_API_KEY is missing in Vercel!");
        return res.status(500).json({ error: 'API key not configured in Vercel' });
    }

    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // Using fetch instead of https module for better reliability
        const response = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_KEY}`,
                'Content-Type': 'application/octet-stream',
                'x-wait-for-model': 'true'
            },
            body: imageBuffer
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HuggingFace Error Response:', errorText);
            return res.status(response.status).json({ 
                error: `HuggingFace API Error: ${response.status}`,
                details: errorText.substring(0, 200) 
            });
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Result = Buffer.from(arrayBuffer).toString('base64');
        
        return res.status(200).json({
            image: `data:image/png;base64,${base64Result}`
        });

    } catch (error) {
        // Detailed logging to see exactly why the connection fails
        console.error('Fetch Handler Error Details:', error);
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
}
