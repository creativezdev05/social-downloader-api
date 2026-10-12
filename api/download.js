// api/download.js
const { instagramDownload } = require('@mrnima/instagram-downloader'); //
const { facebook } = require('@mrnima/facebook-downloader'); //

export default async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is missing.' });
  }

  try {
    let directDownloadUrl = '';

    // 1. INSTAGRAM
    if (url.includes('instagram.com')) {
      const result = await instagramDownload(url); //
      if (result && result.data && result.data.length > 0) {
        const videoData = result.data.find(item => item.type === 'video');
        directDownloadUrl = videoData ? videoData.url : result.data[0].url;
      }
    } 
    // 2. FACEBOOK
    else if (url.includes('facebook.com') || url.includes('fb.watch')) {
      const result = await facebook(url); //
      directDownloadUrl = result.hd || result.sd;
    } 
    // 3. TWITTER / X (Using high-reliability API bridge)
    else if (url.includes('twitter.com') || url.includes('x.com')) {
      // Reformat the link to hit the vxtwitter API endpoint
      const cleanUrl = url.replace('twitter.com', '://vxtwitter.com').replace('x.com', '://vxtwitter.com');
      
      const response = await fetch(cleanUrl);
      const data = await response.json();
      
      if (data && data.media_extended && data.media_extended.length > 0) {
        // Filter out videos and grab the URL
        const videoFile = data.media_extended.find(media => media.type === 'video');
        directDownloadUrl = videoFile ? videoFile.url : null;
      }
    } 
    else {
      return res.status(400).json({ error: 'Platform not supported yet.' });
    }

    if (!directDownloadUrl) {
      return res.status(404).json({ error: 'Could not extract raw file stream.' });
    }

    return res.status(200).json({ success: true, downloadUrl: directDownloadUrl });

  } catch (error) {
    console.error("Backend Error Log:", error.message);
    return res.status(500).json({ error: 'Failed to process video link internally.' });
  }
}
