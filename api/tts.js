/* 小积木 · 神经语音转发接口 v3（Azure 官方通道·终局版）
   前提：Vercel 项目 Settings→Environment Variables 配好
     AZURE_TTS_KEY    = Azure 语音服务的 密钥1
     AZURE_TTS_REGION = 区域（如 eastasia）
   浏览器访问 /api/tts?text=你好&g=f 或 &voice=zh-CN-XiaoxiaoNeural → 返回 MP3（CDN 缓存）
   官方接口，合法稳定；免费层每月 50 万字符。不再需要 ws 依赖（package.json 可留可删，无影响）。 */
export default async function handler(req, res){
  try{
    const KEY=process.env.AZURE_TTS_KEY, REGION=process.env.AZURE_TTS_REGION;
    if(!KEY || !REGION){
      res.status(500).send('config-missing: 请在 Vercel 项目 Settings→Environment Variables 配置 AZURE_TTS_KEY 与 AZURE_TTS_REGION，然后 Redeploy');
      return;
    }
    const q=req.query||{};
    const text=String(q.text||'').slice(0,400).trim();
    if(!text){ res.status(400).send('missing text'); return; }
    const voice=String(q.voice||'')||((q.g==='m')?'zh-CN-YunxiNeural':'zh-CN-XiaoxiaoNeural');

    const short=[...text].length<=4;
    const esc=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const ssml="<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'>"
      +"<voice name='"+voice+"'><prosody rate='"+(short?'-28%':'-8%')+"'>"
      +(short?("<break time='120ms'/>"+esc+"<break time='150ms'/>"):esc)
      +"</prosody></voice></speak>";

    const r=await fetch('https://'+REGION+'.tts.speech.microsoft.com/cognitiveservices/v1',{
      method:'POST',
      headers:{
        'Ocp-Apim-Subscription-Key':KEY,
        'Content-Type':'application/ssml+xml',
        'X-Microsoft-OutputFormat':'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent':'blockquiz-tts'
      },
      body:ssml
    });
    if(!r.ok){
      const msg=await r.text().catch(()=>'');
      res.status(502).send('azure-'+r.status+': '+msg.slice(0,200)
        +(r.status===401?'（密钥不对或没配对区域）':r.status===403?'（配额或订阅问题）':''));
      return;
    }
    const buf=Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=2592000, immutable');
    res.status(200).send(buf);
  }catch(e){
    res.status(502).send('tts-failed: '+(e&&e.message||e));
  }
}
