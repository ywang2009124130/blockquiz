/* 小积木 · 神经语音转发接口 v4（Edge 神经语音·免密钥版，2026-10-11）
   为什么换：Azure 账号已无订阅（免费试用过期，升级即用即付报「用户没有资格」），v3 线上一直回 azure-401，前端只能落系统机器音。
   现在：服务器用 npm 包 msedge-tts 连 Edge 浏览器「大声朗读」同一套神经语音（晓晓 / 云希等），不要密钥、不要订阅、不用配环境变量。
   接口不变：/api/tts?voice=zh-CN-XiaoxiaoNeural&text=你好 → audio/mpeg（CDN 缓存）；也认旧参数 &g=m / &g=f。
   语速与汉字大赛资料站 gen_audio.py 同口径：短词（≤4 字）-20%，句子 -10%。
   出错回 502（前端 bqSpeak 收到非 200 就落系统语音，兜底照旧）。
   提醒：这是 Edge 朗读的公开通道，不是带服务协议的官方付费接口；微软改通道时可能失效，届时升级 msedge-tts 版本即可。 */
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const VOICE_RE=/^[a-z]{2,3}-[A-Z]{2}(-[A-Za-z]+)?-[A-Za-z]+Neural$/;   /* 只收微软神经语音名，防止把杂乱字符拼进 SSML */
const DEF_F='zh-CN-XiaoxiaoNeural', DEF_M='zh-CN-YunxiNeural';
const TIMEOUT_MS=9000;

function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* 合成一段，返回整段 MP3 Buffer；每次请求新开一条连接、用完即关（无状态函数里最稳） */
export function synth(voice, text, rate){
  return new Promise((resolve, reject)=>{
    const tts=new MsEdgeTTS();
    let settled=false;
    const finish=(err, buf)=>{ if(settled) return; settled=true; clearTimeout(timer); try{ tts.close(); }catch(_e){} err?reject(err):resolve(buf); };
    const timer=setTimeout(()=>finish(new Error('timeout')), TIMEOUT_MS);
    tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3).then(()=>{
      const { audioStream }=tts.toStream(esc(text), { rate });
      const chunks=[];
      audioStream.on('data', c=>chunks.push(c));
      audioStream.once('error', e=>finish(e));
      audioStream.once('end', ()=>{
        const buf=Buffer.concat(chunks);
        if(buf.length) finish(null, buf); else finish(new Error('no-audio'));
      });
    }).catch(e=>finish(e));
  });
}

export default async function handler(req, res){
  try{
    const q=req.query||{};
    const text=String(q.text||'').slice(0,400).trim();
    if(!text){ res.status(400).send('missing text'); return; }
    let voice=String(q.voice||'').trim();
    if(!VOICE_RE.test(voice)) voice=(q.g==='m')?DEF_M:DEF_F;
    const rate=([...text].length<=4)?'-20%':'-10%';

    let buf;
    try{ buf=await synth(voice, text, rate); }
    catch(e1){ buf=await synth(voice, text, rate); }   /* 偶发断线重试一次 */

    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Cache-Control','public, max-age=86400, s-maxage=2592000, immutable');
    res.status(200).send(buf);
  }catch(e){
    res.status(502).send('tts-failed: '+(e&&e.message||e));
  }
}
