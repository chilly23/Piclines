// /api/analyze-image.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, location } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Use environment variables for API keys (set in Vercel dashboard)
    const apiKey = process.env.APIKEY;
    const model = "meta-llama/llama-4-maverick:free";
    // const model = "openai/gpt-oss-20b:free";

    const messages = [{
      role: "user",
      content: [
        { 
          type: "text", 
          text: `Write a small creative and deep poem about what you see in this image. You have freedom of any words.[max lines - 8, rhyming - optional, And don't say anything before/after the poem.. I want output only as poem.]` 
        },
        { 
          type: "image_url", 
          image_url: { url: "data:image/jpeg;base64," + image } 
        }
      ]
    }];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model, messages })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return res.status(200).json({ 
        poem: data.choices[0].message.content.replace(/\n/g, '<br>'),
        success: true 
      });
    } else {
      throw new Error('Invalid response format from AI API');
    }

  } catch (error) {
    console.error('AI API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze image',
      message: error.message 
    });
  }
}
