let activeDragWindow = null;
let dragStartX = 0;
let dragStartY = 0;
let windowStartX = 0;
let windowStartY = 0;

function updateClock() {
    const clockEl = document.getElementById('clock');
    if (!clockEl) return;
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    clockEl.innerText = `${hours}:${minutes} ${ampm}`;
}
setInterval(updateClock, 1000);
updateClock();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'startup') {
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = 'triangle';
            o.frequency.setValueAtTime(freq, audioCtx.currentTime);
            g.gain.setValueAtTime(0.05, audioCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.5 + idx * 0.2);
            o.connect(g);
            g.connect(audioCtx.destination);
            o.start();
            o.stop(audioCtx.currentTime + 2.0);
        });
    } else if (type === 'error') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.06);
    }
}

function makeIconsDraggable() {
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        let isDragging = false;
        let startX, startY, initX, initY;
        
        icon.style.position = 'absolute';
        
        icon.addEventListener('mousedown', function(e) {
            if (e.target.closest('.desktop-icon')) {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                initX = icon.offsetLeft;
                initY = icon.offsetTop;
                playSound('click');
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
                
                e.preventDefault();
            }
        });
        
        function onMouseMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            icon.style.left = (initX + dx) + 'px';
            icon.style.top = (initY + dy) + 'px';
        }
        
        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    });
}

function toggleStartMenu() {
    playSound('click');
    const startMenu = document.getElementById('start-menu');
    if (startMenu.style.display === 'none' || !startMenu.style.display) {
        startMenu.style.display = 'flex';
    } else {
        startMenu.style.display = 'none';
    }
}

document.addEventListener('click', function(e) {
    const startMenu = document.getElementById('start-menu');
    const startBtn = document.getElementById('start-btn');
    if (startMenu && startMenu.style.display === 'flex') {
        if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            startMenu.style.display = 'none';
        }
    }
});

function bringToFront(windowId) {
    const windows = document.querySelectorAll('.window');
    windows.forEach(win => {
        win.classList.remove('active-window');
    });
    
    const targetWin = document.getElementById(windowId);
    if (targetWin) {
        targetWin.classList.add('active-window');
        targetWin.style.display = 'flex';
    }
    
    const tabs = document.querySelectorAll('.taskbar-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active-tab');
        if (tab.getAttribute('data-win-id') === windowId) {
            tab.classList.add('active-tab');
        }
    });
}

function openWindow(windowId) {
    const targetWin = document.getElementById(windowId);
    if (!targetWin) return;
    
    playSound('click');
    targetWin.style.display = 'flex';
    bringToFront(windowId);
    
    let existingTab = document.querySelector(`.taskbar-tab[data-win-id="${windowId}"]`);
    if (!existingTab) {
        const taskbarTasks = document.getElementById('taskbar-tasks');
        const tab = document.createElement('div');
        tab.className = 'taskbar-tab active-tab';
        tab.setAttribute('data-win-id', windowId);
        
        const winTitleText = targetWin.querySelector('.titlebar-info span').innerText;
        const winIconSrc = targetWin.querySelector('.titlebar-info img').src;
        
        tab.innerHTML = `<img src="${winIconSrc}" alt="tab-icon"> <span>${winTitleText}</span>`;
        tab.onclick = function() {
            if (targetWin.style.display === 'none') {
                targetWin.style.display = 'flex';
                bringToFront(windowId);
            } else if (targetWin.classList.contains('active-window')) {
                minimizeWindow(windowId);
            } else {
                bringToFront(windowId);
            }
        };
        
        taskbarTasks.appendChild(tab);
    }
    
    const startMenu = document.getElementById('start-menu');
    if (startMenu) startMenu.style.display = 'none';
}

function closeWindow(windowId) {
    playSound('click');
    const targetWin = document.getElementById(windowId);
    if (targetWin) {
        targetWin.style.display = 'none';
    }
    
    const tab = document.querySelector(`.taskbar-tab[data-win-id="${windowId}"]`);
    if (tab) {
        tab.remove();
    }
}

function minimizeWindow(windowId) {
    const targetWin = document.getElementById(windowId);
    if (targetWin) {
        targetWin.style.display = 'none';
    }
    
    const tab = document.querySelector(`.taskbar-tab[data-win-id="${windowId}"]`);
    if (tab) {
        tab.classList.remove('active-tab');
    }
}

function toggleMaximize(windowId) {
    const targetWin = document.getElementById(windowId);
    if (!targetWin) return;
    
    if (targetWin.style.width === '100%' && targetWin.style.height === 'calc(100% - 30px)') {
        targetWin.style.width = targetWin.dataset.prevWidth || '500px';
        targetWin.style.height = targetWin.dataset.prevHeight || '400px';
        targetWin.style.top = targetWin.dataset.prevTop || '100px';
        targetWin.style.left = targetWin.dataset.prevLeft || '100px';
    } else {
        targetWin.dataset.prevWidth = targetWin.style.width;
        targetWin.dataset.prevHeight = targetWin.style.height;
        targetWin.dataset.prevTop = targetWin.style.top;
        targetWin.dataset.prevLeft = targetWin.style.left;
        
        targetWin.style.width = '100%';
        targetWin.style.height = 'calc(100% - 30px)';
        targetWin.style.top = '0';
        targetWin.style.left = '0';
    }
}

function dragStart(e, windowId) {
    bringToFront(windowId);
    const targetWin = document.getElementById(windowId);
    
    if (targetWin.style.width === '100%') return;
    
    activeDragWindow = targetWin;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    windowStartX = parseInt(targetWin.style.left) || 100;
    windowStartY = parseInt(targetWin.style.top) || 100;
    
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
    
    e.preventDefault();
}

function dragMove(e) {
    if (!activeDragWindow) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    
    activeDragWindow.style.left = (windowStartX + dx) + 'px';
    activeDragWindow.style.top = (windowStartY + dy) + 'px';
}

function dragEnd() {
    activeDragWindow = null;
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
}

let paintCanvas, paintCtx;
let isDrawing = false;
let drawColor = '#000000';
let brushSize = 5;

function initPaint() {
    paintCanvas = document.getElementById('paint-canvas');
    if (!paintCanvas) return;
    paintCtx = paintCanvas.getContext('2d');
    
    paintCanvas.width = 460;
    paintCanvas.height = 250;
    paintCtx.fillStyle = '#ffffff';
    paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
    
    paintCanvas.addEventListener('mousedown', function(e) {
        isDrawing = true;
        const rect = paintCanvas.getBoundingClientRect();
        paintCtx.beginPath();
        paintCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        paintCtx.strokeStyle = drawColor;
        paintCtx.lineWidth = brushSize;
        paintCtx.lineCap = 'round';
    });
    
    paintCanvas.addEventListener('mousemove', function(e) {
        if (!isDrawing) return;
        const rect = paintCanvas.getBoundingClientRect();
        paintCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        paintCtx.stroke();
    });
    
    document.addEventListener('mouseup', function() {
        isDrawing = false;
    });
}

function setPaintColor(color) {
    drawColor = color;
    playSound('click');
}

function clearPaintCanvas() {
    if (!paintCtx) return;
    playSound('click');
    paintCtx.fillStyle = '#ffffff';
    paintCtx.fillRect(0, 0, paintCanvas.width, paintCanvas.height);
}

let isPlaying = false;
let mediaProgressInterval = null;
function toggleMediaPlayer() {
    const playBtn = document.getElementById('wmp-play');
    const wmpStatus = document.getElementById('wmp-status-text');
    const wmpProgress = document.getElementById('wmp-progress-bar');
    
    playSound('click');
    if (isPlaying) {
        isPlaying = false;
        playBtn.innerText = '▶';
        wmpStatus.innerText = 'Paused';
        clearInterval(mediaProgressInterval);
    } else {
        isPlaying = true;
        playBtn.innerText = '⏸';
        wmpStatus.innerText = 'Playing: Classic Retro Synth';
        
        let progress = 0;
        mediaProgressInterval = setInterval(() => {
            progress += 2;
            if (progress > 100) progress = 0;
            wmpProgress.style.width = progress + '%';
            
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(100 + (progress % 5) * 50, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.005, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.12);
        }, 500);
    }
}

window.addEventListener('load', function() {
    const activeWindows = document.querySelectorAll('.window');
    activeWindows.forEach(win => {
        if (win.style.display !== 'none') {
            openWindow(win.id);
        }
    });
    
    document.querySelectorAll('.window').forEach(win => {
        win.addEventListener('mousedown', function() {
            bringToFront(win.id);
        });
    });
    
    makeIconsDraggable();
    
    initPaint();
    
    setTimeout(() => {
        playSound('startup');
    }, 1000);
});

function sendEmailViaMailto(e) {
    e.preventDefault();
    const fromVal = document.getElementById('email-from').value.trim();
    const subjectVal = document.getElementById('email-subject').value.trim();
    const bodyVal = document.getElementById('email-body').value.trim();
    const recipient = document.querySelector('#win-guestbook input[readonly]').value.trim();
    
    if (!fromVal || !subjectVal || !bodyVal) {
        playSound('error');
        alert("Please fill in all email fields (From, Subject, and Message) first!");
        return;
    }
    
    playSound('click');
    const statusEl = document.getElementById('guestbook-status');
    if (statusEl) statusEl.innerText = "Sending mail...";
    
    setTimeout(() => {
        if (statusEl) statusEl.innerText = "Message sent to Outbox!";
        
        const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(subjectVal)}&body=${encodeURIComponent(bodyVal)}`;
        window.location.href = mailtoUrl;
    }, 1000);
}

function executeMenuCommand(command, windowId) {
    playSound('click');
    closeAllMenus();
    
    if (command === 'close') {
        closeWindow(windowId);
    } else if (command === 'maximize') {
        toggleMaximize(windowId);
    } else if (command === 'copy') {
        alert("Selection copied to clipboard successfully!");
    } else if (command === 'about') {
        alert("Windows XP CV - Version 1.0\nCreated by giannis1399 using Flask, Python, HTML, CSS & JavaScript.\n\nEnjoy the classic retro experience!");
    } else if (command === 'open') {
        alert("File / Document is already loaded.");
    } else if (command === 'refresh') {
        location.reload();
    } else if (command === 'clear') {
        if (windowId === 'win-paint') {
            clearPaintCanvas();
        } else {
            alert("Nothing to clear.");
        }
    }
}

function toggleMenuDropdown(e) {
    if (e.target.closest('.dropdown-menu')) {
        return;
    }
    
    e.stopPropagation();
    const dropdown = this.querySelector('.dropdown-menu');
    if (!dropdown) return;
    
    const isOpen = dropdown.style.display === 'block';
    closeAllMenus();
    
    if (!isOpen) {
        dropdown.style.display = 'block';
        this.classList.add('active');
    }
}

function closeAllMenus() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
}

document.addEventListener('click', closeAllMenus);

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', toggleMenuDropdown);
});

function loginUser() {
    playSound('startup');
    const welcome = document.getElementById('welcome-screen');
    if (welcome) {
        welcome.style.transform = 'translateY(-100%)';
    }
}

function showLogOffDialog() {
    playSound('click');
    const welcome = document.getElementById('welcome-screen');
    if (welcome) {
        welcome.style.transform = 'translateY(0)';
        const startMenu = document.getElementById('start-menu');
        if (startMenu) startMenu.style.display = 'none';
    }
}

function showTurnOffDialog() {
    playSound('click');
    const overlay = document.getElementById('shutdown-overlay');
    const desktop = document.getElementById('desktop');
    if (overlay) {
        overlay.style.display = 'flex';
        desktop.classList.add('shutdown-greyscale');
    }
    const startMenu = document.getElementById('start-menu');
    if (startMenu) startMenu.style.display = 'none';
}

function closeShutdownDialog() {
    playSound('click');
    const overlay = document.getElementById('shutdown-overlay');
    const desktop = document.getElementById('desktop');
    if (overlay) {
        overlay.style.display = 'none';
        desktop.classList.remove('shutdown-greyscale');
    }
}

function shutdownAction(action) {
    playSound('click');
    closeShutdownDialog();
    
    if (action === 'standby') {
        startScreensaver();
    } else if (action === 'shutdown') {
        document.body.classList.add('shutdown-greyscale');
        
        const notes = [523.25, 392.00, 329.63, 261.63];
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.25);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime + idx * 0.25);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + idx * 0.25 + 0.4);
            osc.start(audioCtx.currentTime + idx * 0.25);
            osc.stop(audioCtx.currentTime + idx * 0.25 + 0.5);
        });
        
        setTimeout(() => {
            const safeScreen = document.getElementById('safe-to-turnoff-screen');
            if (safeScreen) safeScreen.style.display = 'flex';
        }, 2000);
    } else if (action === 'restart') {
        document.body.classList.add('shutdown-greyscale');
        setTimeout(() => {
            location.reload();
        }, 1500);
    }
}

function wakeUpOrRestart() {
    playSound('startup');
    const safeScreen = document.getElementById('safe-to-turnoff-screen');
    if (safeScreen) safeScreen.style.display = 'none';
    document.body.classList.remove('shutdown-greyscale');
    
    const welcome = document.getElementById('welcome-screen');
    if (welcome) {
        welcome.style.transform = 'translateY(0)';
    }
}

async function revealPhone() {
    playSound('click');
    const field = document.getElementById('phone-field');
    if (!field) return;
    
    field.innerHTML = '<span style="font-size:11px; color:#555;">Loading...</span>';
    
    try {
        const response = await fetch('/api/reveal-phone', {
            method: 'POST'
        });
        
        if (response.ok) {
            const result = await response.json();
            field.innerHTML = `<span>${result.phone}</span> <span style="font-size:10px; color:#777; margin-left:5px;">(Views: ${result.clicks})</span>`;
        } else {
            field.innerHTML = '<span>Error loading phone</span>';
            playSound('error');
        }
    } catch (err) {
        console.error(err);
        field.innerHTML = '<span>Connection error</span>';
        playSound('error');
    }
}

let screensaverActive = false;
let screensaverInterval = null;
let starList = [];
const NUM_STARS = 150;

function startScreensaver() {
    screensaverActive = true;
    const overlay = document.getElementById('screensaver-overlay');
    const canvas = document.getElementById('screensaver-canvas');
    if (!overlay || !canvas) return;
    
    overlay.style.display = 'block';
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    
    starList = [];
    for(let i = 0; i < NUM_STARS; i++) {
        starList.push({
            x: Math.random() * canvas.width - canvas.width / 2,
            y: Math.random() * canvas.height - canvas.height / 2,
            z: Math.random() * canvas.width
        });
    }
    
    let textX = 100;
    let textY = 100;
    let dx = 1.5;
    let dy = 1.2;
    
    function draw() {
        if (!screensaverActive) return;
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        
        ctx.fillStyle = '#ffffff';
        starList.forEach(star => {
            star.z -= 4;
            if (star.z <= 0) {
                star.z = canvas.width;
                star.x = Math.random() * canvas.width - canvas.width / 2;
                star.y = Math.random() * canvas.height - canvas.height / 2;
            }
            
            const px = (star.x / star.z) * cx + cx;
            const py = (star.y / star.z) * cy + cy;
            const size = (1 - star.z / canvas.width) * 4;
            
            if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
                ctx.beginPath();
                ctx.arc(px, py, size, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
        
        ctx.fillStyle = '#ff9900';
        ctx.font = "bold 20px 'Courier New', monospace";
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        const displayUrl = window.cvWebsite || "Retro CV";
        ctx.fillText(displayUrl, textX, textY);
        ctx.shadowBlur = 0;
        
        textX += dx;
        textY += dy;
        
        if (textX <= 0 || textX >= canvas.width - 240) dx = -dx;
        if (textY <= 20 || textY >= canvas.height - 20) dy = -dy;
        
        screensaverInterval = requestAnimationFrame(draw);
    }
    
    draw();
}

function stopScreensaver() {
    if (!screensaverActive) return;
    screensaverActive = false;
    cancelAnimationFrame(screensaverInterval);
    
    const overlay = document.getElementById('screensaver-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    playSound('startup');
}

const unlockAudio = () => {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
};
document.addEventListener('click', unlockAudio);
document.addEventListener('keydown', unlockAudio);
