/**
 * 粒子手势交互演示 - 主程序
 * 技术栈: Three.js + MediaPipe Hands
 * 粒子数: 15,000 (平衡性能与效果)
 */

// ============================================
// 配置参数
// ============================================
const CONFIG = {
    particleCount: 15000,
    particleSize: 2.0,
    explosionStrength: 1.5,
    transitionSpeed: 0.05,
    damping: 0.95,
    returnForce: 0.02,
    colors: {
        saturn: { r: 0.4, g: 0.6, b: 1.0 },      // 蓝紫
        heart: { r: 1.0, g: 0.3, b: 0.5 },       // 粉红
        star: { r: 1.0, g: 0.8, b: 0.2 }         // 金黄
    }
};

// ============================================
// 全局状态
// ============================================
const state = {
    currentShape: 'saturn',
    gesture: 'neutral', // 'open', 'close', 'neutral'
    gestureConfidence: 0,
    isExploding: false,
    demoMode: false,
    cameraActive: false,
    frameCount: 0,
    gestureHistory: [],
    lastGestureTime: 0
};

// ============================================
// Three.js 场景
// ============================================
let scene, camera, renderer, particles, geometry, material;
let positions, targetPositions, velocities, colors, sizes;

function initThree() {
    const canvas = document.getElementById('canvas');
    
    // 场景
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);
    
    // 相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;
    
    // 渲染器
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // 创建粒子系统
    createParticles();
    
    // 窗口调整
    window.addEventListener('resize', onWindowResize);
    
    // 开始动画循环
    animate();
}

function createParticles() {
    geometry = new THREE.BufferGeometry();
    
    const count = CONFIG.particleCount;
    positions = new Float32Array(count * 3);
    targetPositions = new Float32Array(count * 3);
    velocities = new Float32Array(count * 3);
    colors = new Float32Array(count * 3);
    sizes = new Float32Array(count);
    
    // 初始化粒子
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // 随机初始位置
        positions[i3] = (Math.random() - 0.5) * 100;
        positions[i3 + 1] = (Math.random() - 0.5) * 100;
        positions[i3 + 2] = (Math.random() - 0.5) * 100;
        
        // 初始速度为0
        velocities[i3] = 0;
        velocities[i3 + 1] = 0;
        velocities[i3 + 2] = 0;
        
        // 大小
        sizes[i] = Math.random() * 0.5 + 0.5;
    }
    
    // 设置初始形态
    generateShape('saturn');
    
    // 复制到当前位置（必须在 generateShape 之后！）
    for (let i = 0; i < count * 3; i++) {
        positions[i] = targetPositions[i];
    }
    
    // 设置几何体属性
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setUsage(THREE.DynamicDrawUsage);
    
    // 创建材质
    material = new THREE.PointsMaterial({
        size: CONFIG.particleSize,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    
    // 创建点云
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// ============================================
// 形态生成算法
// ============================================
function generateShape(shape) {
    const count = CONFIG.particleCount;
    const color = CONFIG.colors[shape];
    
    switch (shape) {
        case 'saturn':
            generateSaturn(count, color);
            break;
        case 'heart':
            generateHeart(count, color);
            break;
        case 'star':
            generateStar(count, color);
            break;
    }
    
    // 更新颜色属性
    const colorAttr = geometry.attributes.color;
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        colorAttr.array[i3] = colors[i3];
        colorAttr.array[i3 + 1] = colors[i3 + 1];
        colorAttr.array[i3 + 2] = colors[i3 + 2];
    }
    colorAttr.needsUpdate = true;
}

// 土星: 球体 + 环
function generateSaturn(count, color) {
    const sphereCount = Math.floor(count * 0.65);
    const ringCount = count - sphereCount;
    
    // 球体 - 斐波那契球面采样
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < sphereCount; i++) {
        const i3 = i * 3;
        const y = 1 - (i / (sphereCount - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = phi * i;
        
        const r = 12 + Math.random() * 2;
        targetPositions[i3] = Math.cos(theta) * radius * r;
        targetPositions[i3 + 1] = y * r;
        targetPositions[i3 + 2] = Math.sin(theta) * radius * r;
        
        // 颜色变化
        const variation = Math.random() * 0.3;
        colors[i3] = color.r + variation;
        colors[i3 + 1] = color.g + variation;
        colors[i3 + 2] = color.b;
    }
    
    // 环
    for (let i = sphereCount; i < count; i++) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const ringRadius = 22 + Math.random() * 8;
        const thickness = (Math.random() - 0.5) * 2;
        
        targetPositions[i3] = Math.cos(angle) * ringRadius;
        targetPositions[i3 + 1] = thickness * 0.5;
        targetPositions[i3 + 2] = Math.sin(angle) * ringRadius;
        
        // 环的颜色偏亮
        colors[i3] = color.r + 0.2;
        colors[i3 + 1] = color.g + 0.2;
        colors[i3 + 2] = color.b + 0.3;
    }
}

// 爱心: 参数方程采样
function generateHeart(count, color) {
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // 参数 t
        const t = Math.random() * Math.PI * 2;
        
        // 2D 心形参数方程
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        
        // 添加厚度
        const z = (Math.random() - 0.5) * 6;
        
        // 缩放
        const scale = 0.8;
        targetPositions[i3] = x * scale;
        targetPositions[i3 + 1] = y * scale;
        targetPositions[i3 + 2] = z;
        
        // 颜色: 中心偏亮，边缘偏暗
        const dist = Math.sqrt(x * x + y * y);
        const brightness = Math.max(0.5, 1 - dist / 20);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g * brightness;
        colors[i3 + 2] = color.b * brightness;
    }
}

// 五芒星: 五角星填充
function generateStar(count, color) {
    const outerRadius = 20;
    const innerRadius = 8;
    const points = 5;
    
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        // 随机选择角度
        const angle = Math.random() * Math.PI * 2;
        
        // 计算五芒星边界
        const sector = Math.floor(angle / (Math.PI / points)) % (points * 2);
        const isOuter = sector % 2 === 0;
        const maxRadius = isOuter ? outerRadius : innerRadius;
        
        // 径向采样
        const r = Math.sqrt(Math.random()) * maxRadius;
        
        targetPositions[i3] = Math.cos(angle) * r;
        targetPositions[i3 + 1] = Math.sin(angle) * r;
        targetPositions[i3 + 2] = (Math.random() - 0.5) * 4;
        
        // 颜色: 根据半径渐变
        const t = r / outerRadius;
        colors[i3] = color.r;
        colors[i3 + 1] = color.g * (0.5 + t * 0.5);
        colors[i3 + 2] = color.b * (1 - t * 0.5);
    }
}

// ============================================
// 粒子动画更新
// ============================================
function updateParticles() {
    const count = CONFIG.particleCount;
    const posAttr = geometry.attributes.position;
    
    for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        
        if (state.isExploding) {
            // 爆炸模式: 添加向外速度 + 涡旋
            const x = posAttr.array[i3];
            const y = posAttr.array[i3 + 1];
            const z = posAttr.array[i3 + 2];
            
            const dist = Math.sqrt(x * x + y * y + z * z) + 0.1;
            const force = CONFIG.explosionStrength / dist;
            
            // 向外爆炸
            velocities[i3] += (x / dist) * force * 0.1;
            velocities[i3 + 1] += (y / dist) * force * 0.1;
            velocities[i3 + 2] += (z / dist) * force * 0.1;
            
            // 涡旋
            velocities[i3] += y * 0.001;
            velocities[i3 + 1] -= x * 0.001;
            
        } else {
            // 还原模式: 向目标位置移动
            const tx = targetPositions[i3];
            const ty = targetPositions[i3 + 1];
            const tz = targetPositions[i3 + 2];
            
            const dx = tx - posAttr.array[i3];
            const dy = ty - posAttr.array[i3 + 1];
            const dz = tz - posAttr.array[i3 + 2];
            
            velocities[i3] += dx * CONFIG.returnForce;
            velocities[i3 + 1] += dy * CONFIG.returnForce;
            velocities[i3 + 2] += dz * CONFIG.returnForce;
        }
        
        // 阻尼
        velocities[i3] *= CONFIG.damping;
        velocities[i3 + 1] *= CONFIG.damping;
        velocities[i3 + 2] *= CONFIG.damping;
        
        // 更新位置
        posAttr.array[i3] += velocities[i3];
        posAttr.array[i3 + 1] += velocities[i3 + 1];
        posAttr.array[i3 + 2] += velocities[i3 + 2];
    }
    
    posAttr.needsUpdate = true;
}

// ============================================
// 动画循环
// ============================================
function animate() {
    requestAnimationFrame(animate);
    
    state.frameCount++;
    
    // 更新粒子
    updateParticles();
    
    // 演示模式
    if (state.demoMode && state.frameCount % 120 === 0) {
        toggleExplosion();
    }
    
    // 旋转场景
    if (!state.isExploding) {
        particles.rotation.y += 0.002;
    }
    
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function toggleExplosion() {
    state.isExploding = !state.isExploding;
    updateGestureUI(state.isExploding ? 'open' : 'close');
}

// ============================================
// MediaPipe Hands 手势识别
// ============================================
let hands, camera;

function initMediaPipe() {
    const videoElement = document.getElementById('inputVideo');
    const canvasElement = document.getElementById('outputCanvas');
    const canvasCtx = canvasElement.getContext('2d');
    
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    hands.onResults((results) => {
        // 绘制手部关键点
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 2
            });
            drawLandmarks(canvasCtx, landmarks, {
                color: '#FF0000',
                lineWidth: 1,
                radius: 3
            });
            
            // 识别手势
            detectGesture(landmarks);
        } else {
            // 没有检测到手
            state.gesture = 'neutral';
            state.gestureConfidence = 0;
        }
        
        canvasCtx.restore();
    });
    
    // 启动摄像头
    camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        width: 320,
        height: 240
    });
    
    camera.start()
        .then(() => {
            state.cameraActive = true;
            updateStatus('已连接', 'green');
        })
        .catch((err) => {
            console.error('摄像头启动失败:', err);
            updateStatus('不可用', 'red');
            // 自动进入演示模式
            document.getElementById('demoModeToggle').checked = true;
            state.demoMode = true;
        });
}

// 手势检测算法
function detectGesture(landmarks) {
    // 关键点索引
    const WRIST = 0;
    const THUMB_TIP = 4;
    const INDEX_TIP = 8;
    const MIDDLE_TIP = 12;
    const RING_TIP = 16;
    const PINKY_TIP = 20;
    const MIDDLE_MCP = 9;
    
    // 计算手掌大小（手腕到中指的平均距离）
    const palmSize = distance(landmarks[WRIST], landmarks[MIDDLE_MCP]);
    
    // 计算指尖到手腕的平均距离
    const tips = [THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP];
    let avgTipDist = 0;
    
    for (const tip of tips) {
        avgTipDist += distance(landmarks[WRIST], landmarks[tip]);
    }
    avgTipDist /= tips.length;
    
    // 归一化指标
    const metric = avgTipDist / palmSize;
    
    // EMA 平滑
    const alpha = 0.3;
    state.gestureConfidence = alpha * metric + (1 - alpha) * state.gestureConfidence;
    
    // Hysteresis 判定
    const OPEN_THRESHOLD = 0.65;
    const CLOSE_THRESHOLD = 0.45;
    const FRAMES_TO_CONFIRM = 10;
    
    const now = Date.now();
    
    if (state.gestureConfidence > OPEN_THRESHOLD) {
        state.gestureHistory.push('open');
    } else if (state.gestureConfidence < CLOSE_THRESHOLD) {
        state.gestureHistory.push('close');
    } else {
        state.gestureHistory.push('neutral');
    }
    
    // 保持历史记录长度
    if (state.gestureHistory.length > FRAMES_TO_CONFIRM) {
        state.gestureHistory.shift();
    }
    
    // 确认手势切换
    if (state.gestureHistory.length === FRAMES_TO_CONFIRM) {
        const opens = state.gestureHistory.filter(g => g === 'open').length;
        const closes = state.gestureHistory.filter(g => g === 'close').length;
        
        if (opens >= FRAMES_TO_CONFIRM * 0.7 && state.gesture !== 'open') {
            state.gesture = 'open';
            state.isExploding = true;
            updateGestureUI('open');
        } else if (closes >= FRAMES_TO_CONFIRM * 0.7 && state.gesture !== 'close') {
            state.gesture = 'close';
            state.isExploding = false;
            updateGestureUI('close');
        }
    }
    
    // 更新置信度条
    const barWidth = Math.min(100, Math.max(0, (state.gestureConfidence - 0.3) / 0.5 * 100));
    document.getElementById('confidenceBar').style.width = `${barWidth}%`;
}

function distance(a, b) {
    return Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2) +
        Math.pow(a.z - b.z, 2)
    );
}

// ============================================
// UI 更新
// ============================================
function updateStatus(text, color) {
    const dot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    dot.className = `w-3 h-3 rounded-full bg-${color}-500`;
    statusText.textContent = text;
}

function updateGestureUI(gesture) {
    const indicator = document.getElementById('gestureIndicator');
    const icon = document.getElementById('gestureIcon');
    const text = document.getElementById('gestureText');
    
    indicator.classList.remove('open', 'close');
    
    if (gesture === 'open') {
        indicator.classList.add('open');
        icon.textContent = '🖐️';
        text.textContent = '张开 - 爆炸';
    } else if (gesture === 'close') {
        indicator.classList.add('close');
        icon.textContent = '✊';
        text.textContent = '握拳 - 还原';
    } else {
        icon.textContent = '✋';
        text.textContent = '等待手势...';
    }
}

function updateShapeButtons(shape) {
    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-purple-600');
        btn.classList.add('bg-gray-800', 'text-gray-300');
    });
    
    const activeBtn = document.getElementById(`btn${shape.charAt(0).toUpperCase() + shape.slice(1)}`);
    activeBtn.classList.add('active');
    activeBtn.classList.remove('bg-gray-800', 'text-gray-300');
    activeBtn.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white');
}

// ============================================
// 事件绑定
// ============================================
function bindEvents() {
    // 形态切换按钮
    document.getElementById('btnSaturn').addEventListener('click', () => switchShape('saturn'));
    document.getElementById('btnHeart').addEventListener('click', () => switchShape('heart'));
    document.getElementById('btnStar').addEventListener('click', () => switchShape('star'));
    
    // 演示模式开关
    document.getElementById('demoModeToggle').addEventListener('change', (e) => {
        state.demoMode = e.target.checked;
    });
    
    // 参数滑块
    document.getElementById('explosionStrength').addEventListener('input', (e) => {
        CONFIG.explosionStrength = parseFloat(e.target.value);
        document.getElementById('explosionValue').textContent = CONFIG.explosionStrength;
    });
    
    document.getElementById('particleSize').addEventListener('input', (e) => {
        CONFIG.particleSize = parseFloat(e.target.value);
        material.size = CONFIG.particleSize;
        document.getElementById('sizeValue').textContent = CONFIG.particleSize;
    });
    
    document.getElementById('transitionSpeed').addEventListener('input', (e) => {
        CONFIG.returnForce = parseFloat(e.target.value);
        document.getElementById('speedValue').textContent = e.target.value;
    });
}

function switchShape(shape) {
    state.currentShape = shape;
    generateShape(shape);
    updateShapeButtons(shape);
}

// ============================================
// 初始化
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    initThree();
    bindEvents();
    initMediaPipe();
});
