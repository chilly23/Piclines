// /api/upload-to-github.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, filename, aiResponse, location, coordinates } = req.body;

    if (!imageBase64 || !filename) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Use environment variables (set in Vercel dashboard)
    const TOKEN = process.env.GITHUB_TOKEN;
    const REPO = process.env.GITHUB_REPO; // format: username/repo-name
    const API_BASE = 'https://api.github.com';

    if (!TOKEN || !REPO) {
      return res.status(500).json({ error: 'GitHub configuration not set' });
    }

    // Upload image
    const imageResponse = await fetch(`${API_BASE}/repos/${REPO}/contents/photos/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add photo ${filename}`,
        content: imageBase64,
        branch: 'main'
      })
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      throw new Error(`Failed to upload image: ${errorData.message || imageResponse.statusText}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.content.download_url;

    // Create metadata
    const metadata = {
      filename,
      imageUrl,
      uploadedAt: new Date().toISOString(),
      location,
      coordinates,
      aiAnalysis: aiResponse,
      size: Math.round(imageBase64.length * 0.75)
    };

    // Upload metadata
    const metadataFilename = `metadata/${filename.replace('.jpg', '.json')}`;
    const metadataResponse = await fetch(`${API_BASE}/repos/${REPO}/contents/${metadataFilename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Add metadata for ${filename}`,
        content: Buffer.from(JSON.stringify(metadata, null, 2)).toString('base64'),
        branch: 'main'
      })
    });

    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.json();
      throw new Error(`Failed to upload metadata: ${errorData.message || metadataResponse.statusText}`);
    }

    return res.status(200).json({ 
      success: true, 
      imageUrl, 
      metadata 
    });

  } catch (error) {
    console.error('GitHub Upload Error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
}