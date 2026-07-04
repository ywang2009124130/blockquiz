/* 小积木 · 神经语音转发接口（放进 Vercel 项目的 api/ 文件夹，文件名 tts.js）
   浏览器访问 /api/tts?text=你好&g=f  →  返回 MP3
   服务器端连微软 edge-tts 接口（无浏览器来源限制）；带 CDN 缓存（同词第二次秒回） */
const TOKEN='6A5AA1D4EAFF4E9FB37E23D68491D6F4';

async function gec(){
  const ticks=Math.floor(Date.now()/1000)+11644473600;
  const win=(ticks-(ticks%300))*10000000;
  const { createHash }=await import('crypto');
  return createHash('sha256').update(String(win)+TOKEN).digest('hex').toUpperCase();
}
function uuid(){ return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g,c=>{
  const r=Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); }); }

export default async function handler(req, res){
  try{
    if(typeof globalThis.WebSocket!=='function'){
      res.status(500).send('Node runtime lacks WebSocket (need Node 22+). 在 Vercel 项目 Settings→Functions 里把 Node.js Version 设为 22.x');
      return;
    }
    const q=req.query||{};
    const text=String(q.text||'').slice(0,400).trim();
    if(!text){ res.status(400).send('missing text'); return; }
    const voice=String(q.voice||'')||((q.g==='m')?'zh-CN-YunxiNeural':'zh-CN-XiaoxiaoNeural');
    const sec=await gec();
    const ws=new WebSocket('wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1'
      +'?TrustedClientToken='+TOKEN+'&Sec-MS-GEC='+sec+'&Sec-MS-GEC-Version=1-131.0.2903.99&ConnectionId='+uuid());
    ws.binaryType='arraybuffer';
    const chunks=[];
    const result=await new Promise((resolve,reject)=>{
      const to=setTimeout(()=>{ try{ws.close();}catch(e){} reject(new Error('timeout')); }, 8000);
      ws.onerror=(e)=>{ clearTimeout(to); reject(new Error('ws-error')); };
      ws.onclose=(ev)=>{ clearTimeout(to); if(!chunks.length) reject(new Error('closed '+ev.code)); };
      ws.onopen=()=>{
        ws.send('X-Timestamp:'+new Date().toISOString()+'\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n'
          +JSON.stringify({context:{synthesis:{audio:{metadataoptions:{sentenceBoundaryEnabled:false,wordBoundaryEnabled:false},outputFormat:'audio-24khz-48kbitrate-mono-mp3'}}}}));
        const short=[...text].length<=4;
        const esc=text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const ssml="<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'>"
          +"<voice name='"+voice+"'><prosody rate='"+(short?'-28%':'-8%')+"'>"
          +(short?("<break time='120ms'/>"+esc+"<break time='150ms'/>"):esc)
          +"</prosody></voice></speak>";
        ws.send('X-RequestId:'+uuid()+'\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:'+new Date().toISOString()+'\r\nPath:ssml\r\n\r\n'+ssml);
      };
      ws.onmessage=(ev)=>{
        if(typeof ev.data==='string'){
          if(ev.data.indexOf('Path:turn.end')>=0){
            clearTimeout(to); try{ws.close();}catch(e){}
            if(!chunks.length) return reject(new Error('empty'));
            resolve(Buffer.concat(chunks.map(a=>Buffer.from(a))));
          }
          return;
        }
        try{
          const buf=Buffer.from(ev.data);
          const hl=buf.readUInt16BE(0);
          const head=buf.slice(2,2+hl).toString('utf8');
          if(head.indexOf('Path:audio')>=0 && buf.length>2+hl) chunks.push(buf.slice(2+hl));
        }catch(e){}
      };
    });
    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=2592000, immutable');
    res.status(200).send(result);
  }catch(e){
    res.status(502).send('tts-failed: '+(e&&e.message||e));
  }
}
