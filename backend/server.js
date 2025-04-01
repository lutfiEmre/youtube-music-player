// server.js
const express = require('express');
const ytDlpExec = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.get('/convert', async (req, res) => {
    const videoUrl = req.query.videoUrl;
    if (!videoUrl) {
        return res.status(400).send("Video URL gereklidir.");
    }

    const outputFile = path.join(__dirname, 'output.mp3');

    try {
        await ytDlpExec(videoUrl, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: outputFile,
            ffmpegLocation: '/opt/homebrew/bin'

        });

        res.download(outputFile, 'song.mp3', (err) => {
            if (err) {
                console.error("Dosya gönderim hatası:", err);
            }
            fs.unlink(outputFile, (unlinkErr) => {
                if (unlinkErr) console.error("Dosya silinemedi:", unlinkErr);
            });
        });
    } catch (error) {
        console.error("Dönüştürme hatası:", error);
        res.status(500).send("Dönüştürme işlemi başarısız.");
    }
});

app.listen(port, () => {
    console.log(`Server ${port} portunda dinleniyor.`);
});
