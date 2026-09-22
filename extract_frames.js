const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const framesDir = path.join(__dirname, 'public', 'frames');
if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

// Check if ffmpeg-static is installed, or install it temporarily
console.log('Obtendo ffmpeg-static...');
try {
  const ffmpegPath = require('ffmpeg-static');
  console.log('FFmpeg path:', ffmpegPath);
  
  const videoPath = path.join(__dirname, 'public', 'animacao rot raque.mp4');
  const outputPath = path.join(framesDir, 'frame_%04d.jpg');

  console.log('Extraindo frames do vídeo...');
  // Extrai frames em alta qualidade (q:v 2) a 24 ou 30 fps
  execSync(`"${ffmpegPath}" -i "${videoPath}" -vf "fps=24,scale=1920:-1" -q:v 3 "${outputPath}"`, { stdio: 'inherit' });
  console.log('Extração concluída com sucesso!');
} catch (e) {
  console.error('Erro na extração:', e.message);
}
