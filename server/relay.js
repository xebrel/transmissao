const WebSocket = require('ws');
const { spawn } = require('child_process');
const http = require('http');

const PORT = 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Servidor Relay RTMP Hoop Streamer Rodando!\n');
});

const wss = new WebSocket.Server({ server });

console.log(`🚀 Servidor Relay RTMP ativado na porta ${PORT}`);
console.log(`Pronto para retransmitir o sinal do celular para o YouTube Live!`);

wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.replace('/?', ''));
  const streamKey = urlParams.get('key');
  const streamServer = urlParams.get('server') || 'rtmp://a.rtmp.youtube.com/live2/';

  if (!streamKey) {
    console.error('❌ Erro: Chave de transmissão do YouTube não fornecida.');
    ws.close();
    return;
  }

  const rtmpUrl = `${streamServer}${streamKey}`;
  console.log(`📡 Iniciando retransmissão para o YouTube: ${rtmpUrl.slice(0, 38)}...`);

  // Spawn FFmpeg to convert browser WebM/MP4 stream to RTMP FLV H.264
  const ffmpeg = spawn('ffmpeg', [
    '-i', 'pipe:0',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-g', '60',
    '-keyint_min', '30',
    '-b:v', '2500k',
    '-c:a', 'aac',
    '-ar', '44100',
    '-b:a', '128k',
    '-f', 'flv',
    rtmpUrl
  ]);

  ffmpeg.stderr.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('frame=') || msg.includes('fps=')) {
      process.stdout.write(`\r🎥 Transmitindo ao vivo no YouTube: ${msg.trim().slice(0, 60)}`);
    }
  });

  ffmpeg.on('close', (code) => {
    console.log(`\n⏹️ FFmpeg finalizado com código: ${code}`);
  });

  ws.on('message', (message) => {
    if (ffmpeg.stdin.writable) {
      ffmpeg.stdin.write(message);
    }
  });

  ws.on('close', () => {
    console.log('\n🔌 Conexão do celular encerrada.');
    if (ffmpeg.stdin.writable) {
      ffmpeg.stdin.end();
    }
    ffmpeg.kill('SIGINT');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor escutando em http://0.0.0.0:${PORT}`);
});
