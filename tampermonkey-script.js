// ==UserScript==
// @name         Libgen 镜像助手 v4 - API版
// @namespace    https://annas-archive.org/
// @version      4.0
// @description  通过API获取最佳Libgen镜像，优化下载体验，支持悬浮窗管理
// @author       You
// @match        https://zh.annas-archive.org/*
// @match        https://*/*
// @match        http://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      your-vercel-app.vercel.app
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // 配置
    const API_BASE = 'https://your-vercel-app.vercel.app/api/speedtest'; // 替换为你的 Vercel API
    const CACHE_DURATION = 10 * 60 * 1000; // 10分钟本地缓存
    const isAnnasMd5Page = location.href.includes('zh.annas-archive.org/md5/');
    
    // 样式注入
    GM_addStyle(`
        .libgen-float-btn {
            position: fixed !important;
            top: 200px !important;
            right: -20px !important;
            width: 50px !important;
            height: 50px !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            border-radius: 25px 0 0 25px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 20px !important;
            cursor: pointer !important;
            z-index: 99999 !important;
            opacity: 0.3 !important;
            transition: all 0.3s ease !important;
            user-select: none !important;
            box-shadow: -2px 2px 10px rgba(0,0,0,0.2) !important;
        }
        
        .libgen-float-btn:hover {
            opacity: 0.9 !important;
            right: -15px !important;
        }
        
        .libgen-float-btn.dragging {
            border-radius: 50% !important;
            right: auto !important;
            opacity: 0.9 !important;
            transform: scale(1.1) !important;
        }
        
        .libgen-panel {
            position: fixed !important;
            top: 150px !important;
            right: 60px !important;
            width: 350px !important;
            max-height: 500px !important;
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px) !important;
            border-radius: 15px !important;
            padding: 20px !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
            z-index: 99998 !important;
            display: none !important;
            overflow-y: auto !important;
            border: 1px solid rgba(255,255,255,0.3) !important;
        }
        
        .libgen-panel h3 {
            margin: 0 0 15px 0 !important;
            color: #2c3e50 !important;
            font-size: 18px !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
        }
        
        .libgen-mirror-item {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 8px 12px !important;
            margin: 5px 0 !important;
            background: rgba(255,255,255,0.7) !important;
            border-radius: 8px !important;
            border-left: 3px solid transparent !important;
        }
        
        .libgen-mirror-item.online {
            border-left-color: #27ae60 !important;
        }
        
        .libgen-mirror-item.offline {
            border-left-color: #e74c3c !important;
        }
        
        .libgen-mirror-info {
            flex: 1 !important;
            font-size: 13px !important;
        }
        
        .libgen-mirror-url {
            font-weight: bold !important;
            color: #2c3e50 !important;
        }
        
        .libgen-mirror-stats {
            color: #7f8c8d !important;
            font-size: 11px !important;
        }
        
        .libgen-mirror-badge {
            background: #3498db !important;
            color: white !important;
            padding: 2px 6px !important;
            border-radius: 10px !important;
            font-size: 10px !important;
            margin-left: 5px !important;
        }
        
        .libgen-controls {
            display: flex !important;
            gap: 8px !important;
            margin-top: 15px !important;
            flex-wrap: wrap !important;
        }
        
        .libgen-btn {
            padding: 8px 12px !important;
            border: none !important;
            border-radius: 20px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            font-weight: bold !important;
            transition: all 0.2s ease !important;
        }
        
        .libgen-btn-primary {
            background: #3498db !important;
            color: white !important;
        }
        
        .libgen-btn-primary:hover {
            background: #2980b9 !important;
            transform: translateY(-1px) !important;
        }
        
        .libgen-btn-success {
            background: #27ae60 !important;
            color: white !important;
        }
        
        .libgen-btn-success:hover {
            background: #229954 !important;
            transform: translateY(-1px) !important;
        }
        
        .libgen-download-block {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            padding: 15px 20px !important;
            border-radius: 12px !important;
            margin: 15px 0 !important;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
            position: relative !important;
            overflow: hidden !important;
        }
        
        .libgen-download-block::before {
            content: '' !important;
            position: absolute !important;
            top: -50% !important;
            left: -50% !important;
            width: 200% !important;
            height: 200% !important;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent) !important;
            transform: rotate(45deg) !important;
            animation: shimmer 3s infinite !important;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%) rotate(45deg); }
            100% { transform: translateX(100%) rotate(45deg); }
        }
        
        .libgen-download-title {
            font-size: 16px !important;
            font-weight: bold !important;
            margin-bottom: 8px !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
        }
        
        .libgen-download-link {
            color: #fff !important;
            text-decoration: none !important;
            font-size: 14px !important;
            padding: 8px 16px !important;
            background: rgba(255,255,255,0.2) !important;
            border-radius: 20px !important;
            display: inline-block !important;
            margin-top: 5px !important;
            transition: all 0.3s ease !important;
            border: 1px solid rgba(255,255,255,0.3) !important;
        }
        
        .libgen-download-link:hover {
            background: rgba(255,255,255,0.3) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        }
        
        .libgen-tooltip {
            position: fixed !important;
            background: rgba(0,0,0,0.9) !important;
            color: white !important;
            padding: 8px 12px !important;
            border-radius: 6px !important;
            font-size: 12px !important;
            z-index: 100000 !important;
            pointer-events: none !important;
            max-width: 200px !important;
        }
        
        .libgen-loading {
            text-align: center !important;
            color: #7f8c8d !important;
            font-size: 13px !important;
            padding: 10px !important;
        }
    `);
    
    // 数据管理
    let cachedData = null;
    let lastFetchTime = 0;
    let floatBtn, panel;
    let hoverTimer = null;
    let tooltip = null;
    
    // API 调用函数
    async function fetchMirrorData(force = false) {
        console.log('[Libgen API] 开始获取镜像数据...');
        
        // 检查缓存
        if (!force && cachedData && Date.now() - lastFetchTime < CACHE_DURATION) {
            console.log('[Libgen API] 使用缓存数据');
            return cachedData;
        }
        
        try {
            // 使用 GM_xmlhttpRequest 避免 CORS 问题
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: force ? `${API_BASE}?force=true` : API_BASE,
                    timeout: 10000,
                    onload: (response) => {
                        try {
                            const data = JSON.parse(response.responseText);
                            if (data.success) {
                                cachedData = data.data;
                                lastFetchTime = Date.now();
                                console.log('[Libgen API] ✅ 数据获取成功:', data.data);
                                resolve(data.data);
                            } else {
                                throw new Error(data.error || '服务器返回错误');
                            }
                        } catch (e) {
                            console.error('[Libgen API] ❌ 解析响应失败:', e);
                            reject(e);
                        }
                    },
                    onerror: (error) => {
                        console.error('[Libgen API] ❌ 请求失败:', error);
                        reject(new Error('网络请求失败'));
                    },
                    ontimeout: () => {
                        console.error('[Libgen API] ❌ 请求超时');
                        reject(new Error('请求超时'));
                    }
                });
            });
        } catch (error) {
            console.error('[Libgen API] ❌ 获取镜像数据失败:', error);
            
            // 如果API失败，尝试使用本地缓存
            const localCache = GM_getValue('libgen_local_cache');
            if (localCache) {
                try {
                    const parsed = JSON.parse(localCache);
                    if (Date.now() - parsed.timestamp < 30 * 60 * 1000) { // 30分钟内的缓存
                        console.log('[Libgen API] 使用本地缓存数据');
                        return parsed.data;
                    }
                } catch (e) {
                    console.error('[Libgen API] 本地缓存解析失败:', e);
                }
            }
            
            throw error;
        }
    }
    
    // 创建悬浮按钮
    function createFloatingButton() {
        floatBtn = document.createElement('div');
        floatBtn.className = 'libgen-float-btn';
        floatBtn.innerHTML = '📚';
        floatBtn.title = 'Libgen 镜像助手';
        
        // 拖拽功能
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        floatBtn.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = floatBtn.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;
            floatBtn.classList.add('dragging');
            floatBtn.style.left = startLeft + 'px';
            floatBtn.style.right = 'auto';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            floatBtn.style.left = (startLeft + deltaX) + 'px';
            floatBtn.style.top = (startTop + deltaY) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                floatBtn.classList.remove('dragging');
                document.body.style.userSelect = '';
                
                // 磁吸到边缘
                const rect = floatBtn.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const windowWidth = window.innerWidth;
                
                if (centerX > windowWidth / 2) {
                    // 吸附到右边
                    floatBtn.style.left = 'auto';
                    floatBtn.style.right = '-20px';
                } else {
                    // 吸附到左边
                    floatBtn.style.left = '-20px';
                    floatBtn.style.right = 'auto';
                    floatBtn.style.borderRadius = '0 25px 25px 0';
                }
            }
        });
        
        // 悬停显示信息
        floatBtn.addEventListener('mouseenter', () => {
            hoverTimer = setTimeout(showTooltipInfo, 5000); // 5秒后显示
        });
        
        floatBtn.addEventListener('mouseleave', () => {
            if (hoverTimer) {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            }
            hideTooltip();
        });
        
        floatBtn.addEventListener('click', (e) => {
            if (!isDragging) {
                togglePanel();
            }
            e.stopPropagation();
        });
        
        document.body.appendChild(floatBtn);
    }
    
    // 显示悬停提示信息
    async function showTooltipInfo() {
        try {
            const data = await fetchMirrorData();
            const onlineMirrors = data.results.filter(r => r.status === 'online');
            const bestMirror = onlineMirrors[0];
            
            if (bestMirror) {
                const domain = new URL(bestMirror.url).hostname;
                showTooltip(`🚀 最佳镜像: ${domain}\\n⚡ 延迟: ${bestMirror.delay}ms\\n🟢 在线: ${data.onlineMirrors}/${data.totalMirrors}`, floatBtn);
            }
        } catch (error) {
            showTooltip('❌ 无法获取镜像信息', floatBtn);
        }
    }
    
    // 创建控制面板
    function createPanel() {
        panel = document.createElement('div');
        panel.className = 'libgen-panel';
        panel.innerHTML = `
            <h3>📚 Libgen 镜像管理</h3>
            <div id="libgen-mirror-list" class="libgen-loading">正在加载镜像信息...</div>
            <div class="libgen-controls">
                <button class="libgen-btn libgen-btn-primary" onclick="window.libgenRefresh()">🔄 刷新</button>
                <button class="libgen-btn libgen-btn-success" onclick="window.libgenOpenMonitor()">📊 监控面板</button>
                <button class="libgen-btn libgen-btn-primary" onclick="window.libgenExport()">📤 导出</button>
            </div>
        `;
        
        document.body.appendChild(panel);
        loadPanelData();
        
        // 点击外部关闭面板
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !floatBtn.contains(e.target)) {
                panel.style.display = 'none';
            }
        });
        
        // 全局函数
        window.libgenRefresh = () => refreshPanelData(true);
        window.libgenOpenMonitor = () => window.open(API_BASE.replace('/api/speedtest', ''), '_blank');
        window.libgenExport = exportData;
    }
    
    function togglePanel() {
        if (!panel) createPanel();
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        if (panel.style.display === 'block') {
            loadPanelData();
        }
    }
    
    async function loadPanelData() {
        const listElement = document.getElementById('libgen-mirror-list');
        listElement.innerHTML = '<div class=\"libgen-loading\">正在加载镜像信息...</div>';
        
        try {
            const data = await fetchMirrorData();
            renderMirrorList(data);
        } catch (error) {
            listElement.innerHTML = `<div class=\"libgen-loading\">❌ 加载失败: ${error.message}</div>`;
        }
    }
    
    async function refreshPanelData(force = false) {
        try {
            const data = await fetchMirrorData(force);
            renderMirrorList(data);
        } catch (error) {
            document.getElementById('libgen-mirror-list').innerHTML = 
                `<div class=\"libgen-loading\">❌ 刷新失败: ${error.message}</div>`;
        }
    }
    
    function renderMirrorList(data) {
        const listElement = document.getElementById('libgen-mirror-list');
        const html = data.results.map(mirror => {
            const domain = new URL(mirror.url).hostname;
            const isOnline = mirror.status === 'online';
            
            return `
                <div class="libgen-mirror-item ${mirror.status}">
                    <div class="libgen-mirror-info">
                        <div class="libgen-mirror-url">
                            ${domain}
                            ${mirror.trusted ? '<span class="libgen-mirror-badge">可信</span>' : ''}
                        </div>
                        <div class="libgen-mirror-stats">
                            ${isOnline ? `${mirror.delay}ms` : '离线'} • 
                            ${new Date(mirror.lastChecked).toLocaleTimeString()}
                        </div>
                    </div>
                    <a href="${mirror.url}" target="_blank" style="color: ${isOnline ? '#27ae60' : '#e74c3c'}; text-decoration: none;">
                        ${isOnline ? '🟢' : '🔴'}
                    </a>
                </div>
            `;
        }).join('');
        
        listElement.innerHTML = html || '<div class=\"libgen-loading\">暂无镜像数据</div>';
    }
    
    // 工具提示
    function showTooltip(text, element) {
        hideTooltip();
        tooltip = document.createElement('div');
        tooltip.className = 'libgen-tooltip';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = (rect.left - tooltip.offsetWidth - 10) + 'px';
        tooltip.style.top = (rect.top + (rect.height - tooltip.offsetHeight) / 2) + 'px';
    }
    
    function hideTooltip() {
        if (tooltip) {
            tooltip.remove();
            tooltip = null;
        }
    }
    
    // 导出数据
    function exportData() {
        if (cachedData) {
            const blob = new Blob([JSON.stringify(cachedData, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `libgen-mirrors-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
    
    // 页面特定功能 - 仅在 Annas Archive 的 md5 页面工作
    async function enhanceAnnasMd5Page() {
        if (!isAnnasMd5Page) return;
        
        console.log('[Libgen] 开始增强 Annas Archive 页面...');
        
        // 获取 MD5
        const md5Match = location.pathname.match(/\/md5\/([a-f0-9]{32})/);
        if (!md5Match) {
            console.log('[Libgen] 未找到 MD5，跳过页面增强');
            return;
        }
        
        const md5 = md5Match[1];
        console.log('[Libgen] 检测到 MD5:', md5);
        
        try {
            const data = await fetchMirrorData();
            const bestMirror = data.results.find(r => r.status === 'online');
            
            if (bestMirror) {
                injectDownloadBlock(bestMirror, md5);
                console.log('[Libgen] ✅ 页面增强完成，使用镜像:', bestMirror.url);
            } else {
                console.log('[Libgen] ❌ 没有可用的镜像');
            }
        } catch (error) {
            console.error('[Libgen] ❌ 页面增强失败:', error);
        }
    }
    
    function injectDownloadBlock(mirror, md5) {
        // 寻找合适的插入位置
        const selectors = [
            'h3:contains(\"快速下载\")',
            '[data-component=\"FastDownloadSection\"]',
            '.text-xl.font-bold:contains(\"下载\")',
            'h2:contains(\"下载\")',
            '.downloads'
        ];
        
        let insertPoint = null;
        for (const selector of selectors) {
            if (selector.includes('contains')) {
                const elements = Array.from(document.querySelectorAll('h3, h2, .text-xl')).filter(el => 
                    el.textContent.includes('下载') || el.textContent.includes('Download')
                );
                if (elements.length > 0) {
                    insertPoint = elements[0];
                    break;
                }
            } else {
                insertPoint = document.querySelector(selector);
                if (insertPoint) break;
            }
        }
        
        // 如果没找到特定位置，插入到主要内容区域
        if (!insertPoint) {
            insertPoint = document.querySelector('main, .container, .content, #content') || document.body;
        }
        
        const domain = new URL(mirror.url).hostname;
        const downloadUrl = `${mirror.url.replace(/\\/$/, '')}/book/index.php?md5=${md5}`;
        
        const downloadBlock = document.createElement('div');
        downloadBlock.className = 'libgen-download-block';
        downloadBlock.innerHTML = `
            <div class="libgen-download-title">
                🚀 优先推荐下载 (${domain})
            </div>
            <a href="${downloadUrl}" target="_blank" class="libgen-download-link">
                📚 立即下载 Libgen ${domain} • ${mirror.delay}ms
            </a>
            <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">
                ✨ 已自动选择最佳镜像 (${mirror.trusted ? '可信站点' : '第三方镜像'})
            </div>
        `;
        
        // 插入下载块
        if (insertPoint.tagName === 'H3' || insertPoint.tagName === 'H2') {
            insertPoint.parentNode.insertBefore(downloadBlock, insertPoint.nextSibling);
        } else {
            insertPoint.insertBefore(downloadBlock, insertPoint.firstChild);
        }
        
        // 显示成功提示
        showNotification('✅ 已自动更新为最佳 Libgen 下载链接');
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 100000;
            animation: fadeInOut 3s ease-in-out;
        `;
        notification.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                15%, 85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }
    
    // 初始化
    function init() {
        console.log('[Libgen] 初始化插件...');
        
        // 创建悬浮按钮（所有页面）
        createFloatingButton();
        
        // 页面特定增强（仅 md5 页面）
        if (isAnnasMd5Page) {
            // 等待页面加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', enhanceAnnasMd5Page);
            } else {
                enhanceAnnasMd5Page();
            }
        }
        
        console.log('[Libgen] ✅ 插件初始化完成');
    }
    
    // 启动
    init();
    
})();
