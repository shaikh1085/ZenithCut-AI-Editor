export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method !== 'POST') return res.status(405).end();

    const HF_KEY = process.env.HUGGINGFACE_API_KEY;
    
    try {
        const { imageBase64 } = req.body;
        const response = await fetch('https://api-inference.huggingface.co/models/briaai/RMBG-1.4', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${HF_KEY}`, 'Content-Type': 'application/octet-stream' },
            body: Buffer.from(imageBase64, 'base64')
        });

        const data = await response.text(); // Yahan error text capture hoga
        
        if (!response.ok) {
            console.error("HF ERROR DETAILS:", data); // Ye Vercel logs mein dikhega
            return res.status(500).json({ error: "HF_FAILED", message: data });
        }

        const buffer = await response.arrayBuffer();
        return res.status(200).json({ image: `data:image/png;base64,${Buffer.from(buffer).toString('base64')}` });

    } catch (e) {
        console.error("SERVER CRASH:", e.message);
        return res.status(500).json({ error: "CRASH", message: e.message });
    }
}
