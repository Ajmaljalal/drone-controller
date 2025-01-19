document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const droneStatus = document.getElementById('droneStatus');
  const batteryLevel = document.getElementById('batteryLevel');
  const altitude = document.getElementById('altitude');
  const speed = document.getElementById('speed');
  const startBtn = document.getElementById('startBtn');
  const takeoffBtn = document.getElementById('takeoffBtn');
  const landBtn = document.getElementById('landBtn');
  const emergencyBtn = document.getElementById('emergencyBtn');
  const lat = document.getElementById('lat');
  const long = document.getElementById('long');
  const systemStatus = document.querySelector('.system-status');
  const throttleGauge = document.querySelector('#throttleGauge .gauge-fill');
  const yawGauge = document.querySelector('#yawGauge .gauge-fill');
  const cameraFeed = document.querySelector('.camera-feed');

  // State
  let isInitialized = false;
  let isFlying = false;
  let currentAltitude = 0;
  let currentSpeed = 0;
  let currentBattery = 100;
  let mouseX = 0;
  let mouseY = 0;
  let targets = [];

  // Add weapon firing functionality
  const fireBtn = document.getElementById('fireBtn');
  let selectedWeapon = 0;
  const weapons = document.querySelectorAll('.weapon-item');

  // Initialize system
  function initializeSystem() {
    const steps = [
      'INITIALIZING SYSTEMS...',
      'CHECKING SENSORS...',
      'CALIBRATING GYROSCOPE...',
      'ESTABLISHING GPS LINK...',
      'SYSTEM INITIALIZED'
    ];

    let i = 0;
    const initInterval = setInterval(() => {
      systemStatus.textContent = steps[i];
      addLog(steps[i], 'system');
      if (i === steps.length - 1) {
        clearInterval(initInterval);
        enableControls();
        updateEnvironmentalData();
      }
      i++;
    }, 800);
  }

  startBtn.addEventListener('click', () => {
    isInitialized = true;
    droneStatus.textContent = 'READY';
    startBtn.disabled = true;

    initializeSystem();
    playStartupSound();
    animateRadarTarget();
  });

  function enableControls() {
    takeoffBtn.disabled = false;
    takeoffBtn.classList.add('pulse-animation');
    fireBtn.disabled = false;
  }

  // Takeoff sequence
  takeoffBtn.addEventListener('click', () => {
    isFlying = true;
    droneStatus.textContent = 'AIRBORNE';
    takeoffBtn.disabled = true;
    landBtn.disabled = false;
    fireBtn.disabled = false;

    // Simulate takeoff
    simulateFlight();
  });

  // Landing sequence
  landBtn.addEventListener('click', () => {
    isFlying = false;
    droneStatus.textContent = 'LANDING';
    landBtn.disabled = true;
    fireBtn.disabled = true;

    // Simulate landing
    simulateLanding();
  });

  // Emergency stop
  emergencyBtn.addEventListener('click', () => {
    emergencyStop();
    fireBtn.disabled = true;
  });

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (!isInitialized || !isFlying) return;

    switch (e.key) {
      case 'ArrowUp':
        updateThrottle(10);
        break;
      case 'ArrowDown':
        updateThrottle(-10);
        break;
      case 'ArrowLeft':
        updateYaw(-10);
        break;
      case 'ArrowRight':
        updateYaw(10);
        break;
      case ' ': // Spacebar
        if (!fireBtn.disabled) {
          fireBtn.click();
        }
        break;
    }
  });

  // Simulation functions
  function simulateFlight() {
    addLog('Initiating takeoff sequence...', 'system');
    let takeoffInterval = setInterval(() => {
      if (currentAltitude < 100) {
        currentAltitude += 5;
        currentSpeed += 2;
        updateTelemetry();
      } else {
        clearInterval(takeoffInterval);
      }
    }, 100);

    // Start battery drain
    startBatteryDrain();
  }

  function simulateLanding() {
    addLog('Initiating landing sequence...', 'system');
    let landingInterval = setInterval(() => {
      if (currentAltitude > 0) {
        currentAltitude -= 5;
        currentSpeed -= 2;
        if (currentSpeed < 0) currentSpeed = 0;
        updateTelemetry();
      } else {
        clearInterval(landingInterval);
        droneStatus.textContent = 'STANDBY';
        takeoffBtn.disabled = false;
        fireBtn.disabled = true;
      }
    }, 100);
  }

  function updateTelemetry() {
    altitude.textContent = `${currentAltitude} M`;
    speed.textContent = `${currentSpeed} KM/H`;

    // Animate value changes
    [altitude, speed].forEach(element => {
      element.style.animation = 'none';
      element.offsetHeight; // Trigger reflow
      element.style.animation = 'valuePulse 0.5s ease';
    });
  }

  function updateThrottle(change) {
    let currentWidth = parseInt(throttleGauge.style.width) || 50;
    let newWidth = Math.max(0, Math.min(100, currentWidth + change));
    throttleGauge.style.width = `${newWidth}%`;

    // Update altitude based on throttle
    if (isFlying) {
      currentAltitude += change / 2;
      updateTelemetry();
    }
  }

  function updateYaw(change) {
    let currentWidth = parseInt(yawGauge.style.width) || 50;
    let newWidth = Math.max(0, Math.min(100, currentWidth + change));
    yawGauge.style.width = `${newWidth}%`;
  }

  function startBatteryDrain() {
    setInterval(() => {
      if (isFlying && currentBattery > 0) {
        currentBattery -= 1;
        batteryLevel.textContent = `${currentBattery}%`;

        if (currentBattery <= 20) {
          batteryLevel.style.color = 'var(--danger-color)';
        }

        if (currentBattery <= 5) {
          emergencyStop();
        }
      }
    }, 1000);
  }

  function emergencyStop() {
    isFlying = false;
    droneStatus.textContent = 'EMERGENCY';
    systemStatus.textContent = 'EMERGENCY STOP ACTIVATED';
    systemStatus.style.color = 'var(--danger-color)';

    // Visual feedback
    document.body.style.animation = 'emergencyPulse 0.5s infinite';

    setTimeout(() => {
      document.body.style.animation = '';
      // Enable system restart after emergency
      startBtn.disabled = false;
      systemStatus.textContent = 'SYSTEM READY FOR RESTART';
      systemStatus.style.color = 'var(--primary-color)';
    }, 2000);

    // Reset controls and state
    takeoffBtn.disabled = true;
    landBtn.disabled = true;
    fireBtn.disabled = true;
    isInitialized = false;
    currentBattery = 100;
    batteryLevel.textContent = '100%';
    batteryLevel.style.color = 'var(--text-color)';

    // Clear all targets
    const radarScreen = document.querySelector('.radar-screen');
    targets.forEach(target => {
      const targetElement = document.getElementById(`target-${target.id}`);
      if (targetElement) {
        targetElement.remove();
      }
    });
    targets = [];

    // Simulate rapid descent
    let emergencyInterval = setInterval(() => {
      if (currentAltitude > 0) {
        currentAltitude -= 10;
        currentSpeed -= 5;
        if (currentSpeed < 0) currentSpeed = 0;
        updateTelemetry();
      } else {
        clearInterval(emergencyInterval);
        droneStatus.textContent = 'STANDBY';
        currentAltitude = 0;
        currentSpeed = 0;
        updateTelemetry();

        // Reset gauges
        throttleGauge.style.width = '50%';
        yawGauge.style.width = '50%';
      }
    }, 100);

    addLog('EMERGENCY STOP INITIATED!', 'error');
    addLog('Engaging emergency protocols...', 'error');
    addLog('Initiating rapid descent...', 'error');

    setTimeout(() => {
      addLog('All systems reset. Ready for restart.', 'system');
    }, 2000);
  }

  // Simulate random coordinates
  setInterval(() => {
    if (isFlying) {
      const randomLat = (Math.random() * 0.001).toFixed(6);
      const randomLong = (Math.random() * 0.001).toFixed(6);
      lat.textContent = `${(51 + parseFloat(randomLat)).toFixed(6)}°N`;
      long.textContent = `${(-0.1 + parseFloat(randomLong)).toFixed(6)}°E`;
    }
  }, 1000);

  // Simulate radar target movement
  function animateRadarTarget() {
    const target = document.querySelector('.radar-target');
    if (!target) return;

    setInterval(() => {
      if (isFlying) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 40 + 10;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        target.style.transform = `translate(${x}px, ${y}px)`;
      }
    }, 2000);
  }

  // Sound effects (you can add actual sound files later)
  function playStartupSound() {
    // Placeholder for startup sound
    console.log('Playing startup sound');
  }

  // Enhanced camera feed interaction
  cameraFeed.addEventListener('mousemove', (e) => {
    if (!isFlying) return;

    const rect = cameraFeed.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    mouseY = ((e.clientY - rect.top) / rect.height) * 100;

    // Move crosshair
    const crosshair = document.querySelector('.crosshair');
    crosshair.style.left = `${mouseX}%`;
    crosshair.style.top = `${mouseY}%`;

    // Update camera overlay with tracking data
    updateCameraOverlay(mouseX, mouseY);
  });

  function updateCameraOverlay(x, y) {
    const overlay = document.querySelector('.camera-overlay');
    overlay.innerHTML = `
      <div class="tracking-data" style="position: absolute; left: ${x}%; top: ${y}%; transform: translate(-50%, -50%); color: var(--primary-color); font-size: 12px;">
        X: ${x.toFixed(2)}%
        Y: ${y.toFixed(2)}%
      </div>
    `;
  }

  // Enhanced radar functionality
  function addRadarTarget() {
    if (targets.length >= 3) return;

    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 40 + 10;
    const target = {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      id: Date.now()
    };

    targets.push(target);

    const targetElement = document.createElement('div');
    targetElement.className = 'radar-target';
    targetElement.id = `target-${target.id}`;
    document.querySelector('.radar-screen').appendChild(targetElement);

    // Animate target appearance
    targetElement.style.transform = `translate(${target.x}px, ${target.y}px)`;
    targetElement.style.animation = 'targetPulse 2s infinite';
  }

  // Add random targets periodically during flight
  setInterval(() => {
    if (isFlying) {
      addRadarTarget();
    }
  }, 5000);

  // Add keyboard controls info
  const controlPanel = document.querySelector('.control-panel');
  const controlsInfo = document.createElement('div');
  controlsInfo.className = 'controls-info';
  controlsInfo.innerHTML = `
    <div class="keyboard-controls">
      <p>Keyboard Controls:</p>
      <span>↑ Increase Altitude</span>
      <span>↓ Decrease Altitude</span>
      <span>← Yaw Left</span>
      <span>→ Yaw Right</span>
      <span>Space Fire Weapon</span>
    </div>
  `;
  controlPanel.appendChild(controlsInfo);

  // Add system log container to control panel
  const systemLogs = document.createElement('div');
  systemLogs.className = 'system-logs';
  systemLogs.innerHTML = `
      <div class="log-header">
          <span>SYSTEM LOGS</span>
          <div class="log-status">●</div>
      </div>
      <div class="log-container"></div>
  `;
  controlPanel.insertBefore(systemLogs, controlsInfo);

  // Add telemetry info
  const telemetryInfo = document.createElement('div');
  telemetryInfo.className = 'telemetry-info';
  telemetryInfo.innerHTML = `
      <div class="info-grid">
          <div class="info-item">
              <span class="info-label">WIND SPEED</span>
              <span class="info-value" id="windSpeed">0 KTS</span>
          </div>
          <div class="info-item">
              <span class="info-label">HEADING</span>
              <span class="info-value" id="heading">000°</span>
          </div>
          <div class="info-item">
              <span class="info-label">TEMP</span>
              <span class="info-value" id="temperature">22°C</span>
          </div>
          <div class="info-item">
              <span class="info-label">SIGNAL</span>
              <span class="info-value" id="signalStrength">100%</span>
          </div>
      </div>
  `;
  document.querySelector('.drone-view').appendChild(telemetryInfo);

  // Log management
  function addLog(message, type = 'info') {
    const logContainer = document.querySelector('.log-container');
    const timestamp = new Date().toLocaleTimeString();
    const log = document.createElement('div');
    log.className = `log-entry ${type}`;
    log.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;
    logContainer.insertBefore(log, logContainer.firstChild);

    // Keep only last 8 logs
    if (logContainer.children.length > 8) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }

  // Update environmental and telemetry data
  function updateEnvironmentalData() {
    setInterval(() => {
      if (isFlying) {
        // Update wind speed
        const windSpeed = (Math.random() * 10 + 5).toFixed(1);
        document.getElementById('windSpeed').textContent = `${windSpeed} KTS`;

        // Update heading
        const heading = (Math.random() * 360).toFixed(0).padStart(3, '0');
        document.getElementById('heading').textContent = `${heading}°`;

        // Update temperature
        const tempVariation = Math.sin(Date.now() / 10000) * 2;
        const temperature = (22 + tempVariation).toFixed(1);
        document.getElementById('temperature').textContent = `${temperature}°C`;

        // Update signal strength
        const signalStrength = Math.max(85, (100 - Math.random() * 15)).toFixed(0);
        const signalElement = document.getElementById('signalStrength');
        signalElement.textContent = `${signalStrength}%`;

        if (signalStrength < 90) {
          addLog('Signal strength degrading: ' + signalStrength + '%', 'warning');
        }

        // Add random system messages
        if (Math.random() < 0.1) {
          const messages = [
            'Optimizing flight path...',
            'Adjusting stabilizers...',
            'Wind compensation active...',
            'GPS signal strong...',
            'Updating navigation data...'
          ];
          addLog(messages[Math.floor(Math.random() * messages.length)]);
        }
      }
    }, 2000);
  }

  // Weapon selection
  weapons.forEach((weapon, index) => {
    weapon.addEventListener('click', () => {
      if (!isFlying) return;
      weapons.forEach(w => w.style.border = '1px solid rgba(0, 102, 255, 0.2)');
      weapon.style.border = '1px solid var(--secondary-color)';
      selectedWeapon = index;
    });
  });

  // Fire weapon
  fireBtn.addEventListener('click', () => {
    if (!isFlying) return;

    const weaponCount = weapons[selectedWeapon].querySelector('.weapon-count');
    const count = parseInt(weaponCount.textContent.slice(1));

    // Check if all weapons are empty
    const allWeaponsEmpty = Array.from(weapons).every(weapon => {
      const count = parseInt(weapon.querySelector('.weapon-count').textContent.slice(1));
      return count === 0;
    });

    // Create and show message function
    const showMessage = (text, type) => {
      const hitMsg = document.createElement('div');
      hitMsg.className = `target-hit ${type}`;
      hitMsg.textContent = text;
      document.querySelector('.camera-feed').appendChild(hitMsg);
      setTimeout(() => hitMsg.classList.add('show'), 100);
      setTimeout(() => {
        hitMsg.classList.remove('show');
        setTimeout(() => hitMsg.remove(), 300);
      }, 2000);
    };

    if (allWeaponsEmpty) {
      showMessage('ALL WEAPONS EMPTY', 'miss');
      addLog('All weapons depleted', 'error');
      return;
    }

    if (count === 0) {
      showMessage('SELECT DIFFERENT WEAPON', 'miss');
      addLog('Current weapon depleted', 'warning');
      return;
    }

    // Calculate hit probability (70% chance to hit)
    const isHit = Math.random() < 0.7;

    // Show hit/miss message
    showMessage(isHit ? 'TARGET HIT' : 'TARGET MISSED', isHit ? 'hit' : 'miss');

    // Update weapon count
    weaponCount.textContent = `x${count - 1}`;

    // Add log message
    const weaponName = weapons[selectedWeapon].querySelector('.weapon-name').textContent;
    addLog(`Fired ${weaponName} - ${isHit ? 'Target Hit' : 'Target Missed'}`, isHit ? 'warning' : 'error');

    // Update weapon status if empty
    if (count - 1 === 0) {
      const statusElement = weapons[selectedWeapon].querySelector('.weapon-status');
      statusElement.textContent = 'EMPTY';
      statusElement.style.color = 'var(--danger-color)';

      // If all weapons are now empty, update the fire button
      if (Array.from(weapons).every(w => parseInt(w.querySelector('.weapon-count').textContent.slice(1)) === 0)) {
        fireBtn.disabled = true;
        addLog('All weapons depleted', 'error');
      }
    }
  });

  // Add CSS for new animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes valuePulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    @keyframes targetPulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.5); opacity: 0.5; }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes emergencyPulse {
      0% { background-color: var(--background-color); }
      50% { background-color: rgba(255, 0, 0, 0.1); }
      100% { background-color: var(--background-color); }
    }

    .keyboard-controls {
      margin-top: 20px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 5px;
    }

    .keyboard-controls p {
      color: var(--primary-color);
      margin-bottom: 5px;
    }

    .keyboard-controls span {
      display: block;
      font-size: 0.9em;
      margin: 2px 0;
    }

    .pulse-animation {
      animation: buttonPulse 2s infinite;
    }

    @keyframes buttonPulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(0, 255, 136, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 255, 136, 0); }
    }

    .system-logs {
      margin-top: 20px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--primary-color);
      border-radius: 5px;
      overflow: hidden;
    }

    .log-header {
      background: rgba(0, 255, 136, 0.1);
      padding: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--primary-color);
    }

    .log-status {
      color: var(--primary-color);
      animation: blink 2s infinite;
    }

    .log-container {
      padding: 10px;
      max-height: 200px;
      overflow-y: auto;
      font-family: monospace;
    }

    .log-entry {
      margin: 5px 0;
      font-size: 0.9em;
      opacity: 0;
      animation: fadeIn 0.3s forwards;
    }

    .log-entry.error {
      color: var(--danger-color);
    }

    .log-entry.warning {
      color: #ffaa00;
    }

    .log-entry.system {
      color: var(--primary-color);
    }

    .log-time {
      color: var(--secondary-color);
      margin-right: 5px;
    }

    .telemetry-info {
      margin-top: 20px;
      padding: 15px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--secondary-color);
      border-radius: 5px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .info-label {
      font-size: 0.8em;
      color: var(--secondary-color);
    }

    .info-value {
      font-size: 1.1em;
      font-weight: bold;
      color: var(--text-color);
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}); 