export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { imageBase64 } = req.body;
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // Sabse simple Fetch call, koi complex timeout ya signal nahi
        const response = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/octet-stream'
            },
            body: imageBuffer
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("HF API Error:", err);
            return res.status(response.status).json({ error: 'HF Error', details: err });
        }

        const buffer = await response.arrayBuffer();
        return res.status(200).json({ image: `data:image/png;base64,${Buffer.from(buffer).toString('base64')}` });

    } catch (err) {
        console.error("Fetch Crash:", err);
        return res.status(500).json({ error: "Network Error", details: err.message });
    }
}
