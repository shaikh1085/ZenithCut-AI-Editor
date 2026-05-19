export default async function handler(req, res) {
  // Sirf POST request ko allow karein
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;
    const apiKey = process.env.GEMINI_API_KEY; // Yeh Vercel se automatic key utha lega

    if (!apiKey) {
      return res.status(500).json({ error: 'API key Vercel mein missing hai.' });
    }

    // Yahan se backend secure tarike se Google Gemini API ko request bhejega
    const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Your task is to segment the main subject. Return the image EXACTLY as it is, but replace the entire background with a solid flat bright green color (#00FF00). Do not change, crop, or warp the foreground subject. Output ONLY the raw base64 string of the processed PNG image, without markdown tags or extra text." },
              { inlineData: { mimeType: "image/png", data: image } }
            ]
          }
        ]
      })
    });

    const data = await googleResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Server mein koi masla hai' });
  }
}
