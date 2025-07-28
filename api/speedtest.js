// api/speedtest.js - Vercel Edge Function

// 配置 Edge Runtime
export const config = {
  runtime: 'edge',
};

const defaultMirrors = [
  'http://libgen.rs/',
  'http://libgen.st/', 
  'http://libgen.is/',
  'http://93.174.95.27/',
  'http://185.39.10.101/',
  'http://libgen.li',
  'http://libgen.gs',
  'https://libgen.la/',
  'https://libgen.bz/',
  'https://libgen.vg/',
  'https://libgen.gl/',
];

const trustedDomains = ['libgen.st', 'libgen.rs', 'libgen.is'];

// 内存缓存（生产环境建议用 Redis 或数据库）
let speedTestCache = null;
let lastTestTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

async function testMirrorSpeed(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  const start = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) throw new Error('not ok');
    
    const delay = Date.now() - start;
    return {
      url: url.replace(/\/$/, ''),
      status: 'online',
      delay,
      trusted: trustedDomains.some(domain => url.includes(domain)),
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      url: url.replace(/\/$/, ''),
      status: 'offline',
      delay: null,
      trusted: trustedDomains.some(domain => url.includes(domain)),
      lastChecked: new Date().toISOString(),
      error: error.message
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function performSpeedTest() {
  console.log('Starting speed test for all mirrors...');
  const results = await Promise.all(defaultMirrors.map(testMirrorSpeed));
  
  // 排序：可用性优先，然后可信度，最后按延迟
  const sorted = results.sort((a, b) => {
    // 1. 按状态排序 (online > offline)
    if (a.status !== b.status) {
      return a.status === 'online' ? -1 : 1;
    }
    
    // 2. 如果都在线，按可信度排序 (trusted > untrusted)
    if (a.status === 'online' && b.status === 'online') {
      if (a.trusted !== b.trusted) {
        return a.trusted ? -1 : 1;
      }
      
      // 3. 如果可信度相同，按延迟排序
      return a.delay - b.delay;
    }
    
    return 0;
  });
  
  speedTestCache = {
    results: sorted,
    timestamp: Date.now(),
    totalMirrors: results.length,
    onlineMirrors: results.filter(r => r.status === 'online').length,
    trustedOnline: results.filter(r => r.status === 'online' && r.trusted).length
  };
  
  lastTestTime = Date.now();
  console.log(`Speed test completed. ${speedTestCache.onlineMirrors}/${speedTestCache.totalMirrors} mirrors online`);
  
  return speedTestCache;
}




export default async function handler(req) {
  const now = Date.now();
  
  // Edge Runtime 使用不同的响应格式
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get('force') === 'true';
  
  try {
    // 如果缓存过期或强制刷新，重新测速
    if (!speedTestCache || now - lastTestTime > CACHE_DURATION || forceRefresh) {
      await performSpeedTest();
    }
    
    // 根据请求类型返回不同格式
    if (url.searchParams.get('format') === 'simple') {
      // 简化格式，只返回最佳镜像
      const bestMirror = speedTestCache.results.find(r => r.status === 'online');
      return new Response(JSON.stringify({
        success: true,
        bestMirror,
        cached: !forceRefresh && now - lastTestTime < CACHE_DURATION,
        cacheAge: now - lastTestTime,
        nextUpdate: CACHE_DURATION - (now - lastTestTime)
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // 完整格式
    return new Response(JSON.stringify({
      success: true,
      data: speedTestCache,
      cached: !forceRefresh && now - lastTestTime < CACHE_DURATION,
      cacheAge: now - lastTestTime,
      nextUpdate: Math.max(0, CACHE_DURATION - (now - lastTestTime))
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Speed test error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      cached: false
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
