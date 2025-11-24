// api/proxy.js
export const config = {
  runtime: 'edge', // 최신 Edge Runtime 사용 (파일 전송 처리에 유리)
};

export default async function handler(req) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type'); // 'tts' 또는 'stt'
  const apiKey = process.env.OPENAI_API_KEY; // Vercel 환경변수에서 키를 가져옴

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API Key missing' }), { status: 500 });
  }

  // 1. TTS (Text-to-Speech) 처리
  if (type === 'tts') {
    try {
      const requestBody = await req.json();
      const openaiRes = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      // OpenAI에서 받은 오디오 데이터를 그대로 클라이언트에 전달
      return new Response(openaiRes.body, {
        headers: { 'Content-Type': 'audio/mpeg' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  // 2. STT (Speech-to-Text) 처리
  if (type === 'stt') {
    try {
      // 클라이언트가 보낸 FormData(오디오 파일)를 그대로 OpenAI로 토스
      // 중요: 헤더에서 Content-Type(boundary 포함)을 가져와야 함
      const contentType = req.headers.get('content-type');
      
      const openaiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": contentType, // multipart/form-data boundary 유지
        },
        body: req.body,
      });

      const data = await openaiRes.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  return new Response("Invalid Request", { status: 400 });
}
