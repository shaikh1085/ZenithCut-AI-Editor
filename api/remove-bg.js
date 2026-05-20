export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).end();

    const HF_KEY = process.env.HUGGINGFACE_API_KEY;

    try {
        const { imageBase64 } = req.body;
        
        // 15 seconds ka timeout force kar rahe hain taake 5ms mein crash na ho
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_KEY}`,
                'Content-Type': 'application/octet-stream'
            },
            body: Buffer.from(imageBase64, 'base64'),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("HF Error:", errorText);
            return res.status(500).json({ error: "HF_API_FAILED", details: errorText });
        }

        const buffer = await response.arrayBuffer();
        const base64Result = Buffer.from(buffer).toString('base64');
        
        return res.status(200).json({ image: `data:image/png;base64,${base64Result}` });

    } catch (error) {
        console.error("Critical Fetch Error:", error);
        return res.status(500).json({ error: "NETWORK_ERROR", details: error.message });
    }
}
