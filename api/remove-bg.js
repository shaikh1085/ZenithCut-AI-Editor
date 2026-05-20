export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // DEBUGGING: Check if API Key exists
    const HF_KEY = process.env.HUGGINGFACE_API_KEY;
    console.log("Checking API Key availability...");
    if (!HF_KEY) {
        console.error("API KEY IS MISSING!");
        return res.status(500).json({ error: 'API key not configured in Vercel' });
    }
    console.log("API Key loaded (length):", HF_KEY.length);

    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

        const imageBuffer = Buffer.from(imageBase64, 'base64');

        console.log("Attempting fetch to HuggingFace...");
        
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
            console.error("HF Request Failed:", response.status, errorText);
            return res.status(response.status).json({ error: 'HF API Error', details: errorText });
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Result = Buffer.from(arrayBuffer).toString('base64');
        
        return res.status(200).json({
            image: `data:image/png;base64,${base64Result}`
        });

    } catch (error) {
        // Log the ENOTFOUND error specifically
        console.error("CRITICAL NETWORK ERROR:", error.message);
        return res.status(500).json({ error: "Network Error: Could not connect to HuggingFace. Please try again later." });
    }
}
