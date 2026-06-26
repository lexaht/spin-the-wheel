/**
 * Spin & Beats - Core Application Logic
 * Implements: Canvas rendering, spin physics, Web Audio API synthesis,
 * Apple Music embed conversion, PWA local storage, and presets management.
 */

// ==========================================================================
// 1. Core Presets Data
// ==========================================================================
const PRESETS = {
  party: [
    { name: "Dance Off!", url: "https://music.apple.com/us/album/thriller/269399213?i=269399260", color: "#ff007f" },
    { name: "Karaoke Solo", url: "https://music.apple.com/us/album/bohemian-rhapsody/1440651117?i=1440651120", color: "#8a2be2" },
    { name: "Take a Shot!", url: "https://music.apple.com/us/album/shots-feat-lil-jon/1440788647?i=1440788936", color: "#00f0ff" },
    { name: "Air Guitar", url: "https://music.apple.com/us/album/sweet-child-o-mine/1377813284?i=1377813295", color: "#ffbb00" },
    { name: "Group Dance", url: "https://music.apple.com/us/album/macarena/262078601?i=262078652", color: "#39ff14" },
    { name: "Freeze!", url: "https://music.apple.com/us/album/u-cant-touch-this/725807185?i=725807204", color: "#ff5e00" },
    { name: "Trivia Time", url: "https://music.apple.com/us/album/jeopardy-theme-song/275323984?i=275324108", color: "#0044ff" },
    { name: "Slow Motion", url: "https://music.apple.com/us/album/chariots-of-fire/358249053?i=358249061", color: "#ff0055" }
  ],
  hiphop: [
    { name: "Breakdance", url: "https://music.apple.com/us/album/its-tricky/254346367?i=254346376", color: "#ff007f" },
    { name: "Rap Battle", url: "https://music.apple.com/us/album/lose-yourself-soundtrack-version/1440904325?i=1440904423", color: "#8a2be2" },
    { name: "Hype Walk", url: "https://music.apple.com/us/album/in-da-club/1440818541?i=1440818548", color: "#00f0ff" },
    { name: "Cha Cha Slide", url: "https://music.apple.com/us/album/cha-cha-slide-original-live-platinum-band-mix/1444158400?i=1444158406", color: "#ffbb00" },
    { name: "Jump Around", url: "https://music.apple.com/us/album/jump-around/1601440263?i=1601440264", color: "#39ff14" },
    { name: "Drop It Hot", url: "https://music.apple.com/us/album/drop-it-like-its-hot-feat-pharrell-williams/1440833116?i=1440833215", color: "#ff5e00" },
    { name: "Shuffle!", url: "https://music.apple.com/us/album/party-rock-anthem-feat-lauren-bennett-goonrock/1440788647?i=1440788661", color: "#0044ff" },
    { name: "Hey Ya Dance", url: "https://music.apple.com/us/album/hey-ya/281511150?i=281511202", color: "#ff0055" }
  ],
  chill: [
    { name: "Tell a Story", url: "https://music.apple.com/us/album/aint-no-sunshine/391953259?i=391953265", color: "#ff007f" },
    { name: "Slow Sway", url: "https://music.apple.com/us/album/dont-know-why/1440818789?i=1440818791", color: "#8a2be2" },
    { name: "Humming Game", url: "https://music.apple.com/us/album/sittin-on-the-dock-of-the-bay/998595568?i=998595574", color: "#00f0ff" },
    { name: "Stare Contest", url: "https://music.apple.com/us/album/banana-pancakes/1440854432?i=1440854611", color: "#ffbb00" },
    { name: "Group Toast", url: "https://music.apple.com/us/album/three-little-birds/1440652352?i=1440652516", color: "#39ff14" },
    { name: "Deep Breath", url: "https://music.apple.com/us/album/orinoco-flow/71783030?i=71783266", color: "#ff5e00" },
    { name: "High Five Match", url: "https://music.apple.com/us/album/aint-no-mountain-high-enough/1440742186?i=1440742200", color: "#0044ff" },
    { name: "Magic Trick", url: "https://music.apple.com/us/album/yellow/1122782080?i=1122782293", color: "#ff0055" }
  ]
};

// Default Palette for additions
const COLOR_PALETTE = ["#ff007f", "#8a2be2", "#00f0ff", "#ffbb00", "#39ff14", "#ff5e00", "#0044ff", "#ff0055"];

// ==========================================================================
// 2. Synthesized Sound System (Web Audio API)
// ==========================================================================
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  // Audio Context must be initialized on a direct user gesture to bypass iOS restriction
  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playTick() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = "sine";
    // Crisp tick sound: fast sweep from 900Hz to 180Hz
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

    // Highpass filter for clicky mechanical feel
    filter.type = "highpass";
    filter.frequency.setValueAtTime(500, now);

    // Instant volume ramp down
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  playWin() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    // Energetic major-chord arpeggio: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "triangle"; // Nostalgic arcade/retro tone
      osc.frequency.setValueAtTime(freq, startTime);

      // Pitch sweep on final note for extra impact
      if (idx === notes.length - 1) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.25, startTime + 0.35);
      }

      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }
}

const synth = new SoundSynth();

// ==========================================================================
// 3. Application State & Storage
// ==========================================================================
let slots = [];
let soundEnabled = true;
let isSpinning = false;
let currentAngle = 0;
let angularVelocity = 0;
let lastTickIndex = 0;

// Load settings from LocalStorage or fallback to defaults
function loadState() {
  const storedSlots = localStorage.getItem("spin_beats_slots");
  const storedSound = localStorage.getItem("spin_beats_sound");
  
  if (storedSlots) {
    try {
      slots = JSON.parse(storedSlots);
    } catch (e) {
      slots = [...PRESETS.party];
    }
  } else {
    slots = [...PRESETS.party];
  }

  if (storedSound !== null) {
    soundEnabled = storedSound === "true";
  } else {
    soundEnabled = true;
  }
  
  synth.enabled = soundEnabled;
  updateSoundUI();
}

function saveState() {
  localStorage.setItem("spin_beats_slots", JSON.stringify(slots));
  localStorage.setItem("spin_beats_sound", soundEnabled.toString());
}

// ==========================================================================
// 4. URL Parser for Apple Music
// ==========================================================================
function parseAppleMusicUrl(url) {
  if (!url) return "";
  let cleanUrl = url.trim();

  // Extract source URL if they pasted complete iframe HTML embed code
  const iframeSrcRegex = /src=["'](https:\/\/embed\.music\.apple\.com[^"']+)["']/;
  const match = cleanUrl.match(iframeSrcRegex);
  if (match) {
    return match[1];
  }

  // Convert standard Apple Music URL to embeddable player URL
  if (cleanUrl.includes("music.apple.com")) {
    cleanUrl = cleanUrl.replace("music.apple.com", "embed.music.apple.com");
  }

  // Enforce secure HTTPS
  if (cleanUrl.startsWith("http://")) {
    cleanUrl = cleanUrl.replace("http://", "https://");
  }

  return cleanUrl;
}

// ==========================================================================
// 5. Canvas Wheel Renderer
// ==========================================================================
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");

function drawWheel() {
  const size = canvas.width;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = centerX - 15; // padding for rim lights
  const numSegments = slots.length;
  const segmentAngle = (2 * Math.PI) / numSegments;

  ctx.clearRect(0, 0, size, size);

  // 5.1 Draw Wheel Segments
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(currentAngle);

  for (let i = 0; i < numSegments; i++) {
    const startAngle = i * segmentAngle;
    const endAngle = startAngle + segmentAngle;
    
    // Draw slice background
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.fillStyle = slots[i].color || "#333";
    ctx.fill();

    // Subtle dark overlay to give radial depth
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.4)");
    gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.15)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.65)");
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw segment divider line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(endAngle) * radius, Math.sin(endAngle) * radius);
    ctx.strokeStyle = "rgba(10, 10, 20, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Text in Segment
    ctx.save();
    const middleAngle = startAngle + segmentAngle / 2;
    ctx.rotate(middleAngle);
    
    // Position text outward
    ctx.translate(radius * 0.55, 0);
    
    // Style text
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Dynamic text sizing based on length and segment count
    let maxTextWidth = radius * 0.45;
    let baseFontSize = numSegments > 12 ? 10 : (numSegments > 8 ? 12 : 14);
    ctx.font = `800 ${baseFontSize}px 'Space Grotesk', sans-serif`;

    let displayName = slots[i].name;
    let textWidth = ctx.measureText(displayName).width;

    // Shrink font if text overflows
    if (textWidth > maxTextWidth) {
      let shrinkRatio = maxTextWidth / textWidth;
      let newFontSize = Math.floor(baseFontSize * shrinkRatio);
      ctx.font = `800 ${Math.max(8, newFontSize)}px 'Space Grotesk', sans-serif`;
      
      // Secondary check: truncate if still too long
      if (newFontSize < 8) {
        displayName = displayName.substring(0, 10) + "...";
      }
    }

    // Shadow for text readability
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Draw text horizontally relative to rotated segment
    ctx.fillText(displayName, 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // 5.2 Draw Outer Ring Frame
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 2, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 6;
  ctx.stroke();

  // Draw inner glow ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius - 2, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
  ctx.lineWidth = 4;
  ctx.stroke();

  // 5.3 Draw Rim Lights (Casino-style flashing lightbulbs)
  const numDots = 24;
  for (let i = 0; i < numDots; i++) {
    // Bulbs rotate or cycle when spinning
    const dotAngle = (i * 2 * Math.PI) / numDots + (isSpinning ? Date.now() / 200 : 0);
    const dotX = centerX + Math.cos(dotAngle) * (radius - 5);
    const dotY = centerY + Math.sin(dotAngle) * (radius - 5);

    // Alternate colors and flashing pattern
    const isLit = Math.floor(dotAngle * 3.5) % 2 === 0;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3.5, 0, 2 * Math.PI);
    
    if (isLit) {
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    }
    
    ctx.fill();
    ctx.restore();
  }
}

// Ensure Canvas scales cleanly for retina displays
function setupCanvasHD() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  drawWheel();
}

// Window resize listener
window.addEventListener("resize", () => {
  setupCanvasHD();
});

// ==========================================================================
// 6. Spin Mechanics & Physics Loop
// ==========================================================================
function spin() {
  if (isSpinning) return;
  
  // Resumes audio context if iOS browser has blocked it
  synth.resume();

  isSpinning = true;
  document.getElementById("spinBtn").disabled = true;
  document.getElementById("statusIndicator").textContent = "SPINNING...";
  
  // Pick random speed: between 0.22 and 0.44 rad/frame (12.6 to 25.2 degrees/frame)
  angularVelocity = 0.22 + Math.random() * 0.22;
  lastTickIndex = -1;

  requestAnimationFrame(updateSpin);
}

function updateSpin() {
  if (angularVelocity > 0.0006) {
    // Apply deceleration friction
    const friction = 0.984 + (Math.random() * 0.002); // slight variance for uncertainty
    angularVelocity *= 0.985;
    currentAngle += angularVelocity;

    // Trigger tick sound effects when segment boundaries cross the pointer
    const numSegments = slots.length;
    const segmentAngle = (2 * Math.PI) / numSegments;
    
    // Track boundary crossings
    const currentTickIndex = Math.floor(currentAngle / segmentAngle);
    if (currentTickIndex !== lastTickIndex) {
      synth.playTick();
      lastTickIndex = currentTickIndex;
    }

    drawWheel();
    requestAnimationFrame(updateSpin);
  } else {
    // Spin complete
    isSpinning = false;
    angularVelocity = 0;
    document.getElementById("spinBtn").disabled = false;
    
    calculateWinner();
  }
}

function calculateWinner() {
  const numSegments = slots.length;
  const segmentAngle = (2 * Math.PI) / numSegments;

  // Normalized pointer angle is 270 degrees (1.5 * Math.PI) in Canvas coordinates
  let targetAngle = (1.5 * Math.PI - currentAngle) % (2 * Math.PI);
  if (targetAngle < 0) {
    targetAngle += 2 * Math.PI;
  }

  const winningIndex = Math.floor(targetAngle / segmentAngle);
  const winner = slots[winningIndex];

  // Play fanfare
  synth.playWin();

  // Present winning details
  document.getElementById("statusIndicator").textContent = `LANDED ON: ${winner.name.toUpperCase()}!`;
  
  showWinnerModal(winner);
}

// ==========================================================================
// 7. Dynamic Modal Controller (Apple Music Iframe Injection)
// ==========================================================================
function showWinnerModal(winner) {
  const modal = document.getElementById("winnerModal");
  const title = document.getElementById("winnerTitle");
  const container = document.getElementById("playerContainer");
  const loader = document.getElementById("playerLoader");

  title.textContent = winner.name;
  title.style.textShadow = `0 0 20px ${winner.color || '#ff007f'}`;

  // Flush previous iframe
  container.innerHTML = "";
  loader.classList.remove("hidden");

  // Format Apple Music URL
  const embedUrl = parseAppleMusicUrl(winner.url);

  if (embedUrl) {
    // Generate Apple Music Iframe Player
    const iframe = document.createElement("iframe");
    iframe.src = embedUrl;
    iframe.allow = "autoplay *; encrypted-media *; fullscreen *; clipboard-write";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.borderRadius = "18px";
    
    // Hide loader once iframe has fully rendered
    iframe.addEventListener("load", () => {
      loader.classList.add("hidden");
    });

    container.appendChild(iframe);
  } else {
    // If no song configured, display a placeholder visualizer/notice
    loader.classList.add("hidden");
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; color:var(--text-secondary); text-align:center; padding: 20px;">
        <svg viewBox="0 0 24 24" width="48" height="48" style="fill:var(--text-muted); margin-bottom:10px;">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
        </svg>
        <p style="font-size:0.85rem; font-weight:600;">No song linked to this slot!</p>
        <p style="font-size:0.75rem; margin-top:5px; color:var(--text-muted);">Add an Apple Music URL in settings to play audio.</p>
      </div>
    `;
  }

  // Display modal overlay
  modal.classList.remove("hidden");
}

function hideWinnerModal() {
  const modal = document.getElementById("winnerModal");
  modal.classList.add("hidden");
  
  // Wipe iframe content immediately to kill background playback
  document.getElementById("playerContainer").innerHTML = "";
}

// ==========================================================================
// 8. Settings & Drawer Controller
// ==========================================================================
const drawer = document.getElementById("settingsDrawer");
const slotsListContainer = document.getElementById("slotsList");

function openSettings() {
  // Populate current configuration
  renderSlotsEditor();
  updateSlotCountBadge();
  highlightActivePreset();
  drawer.classList.remove("hidden");
}

function closeSettings() {
  drawer.classList.add("hidden");
}

function updateSlotCountBadge() {
  document.getElementById("slotCount").textContent = `${slots.length} Slots`;
}

// Find if matches preset structure perfectly
function highlightActivePreset() {
  const presetButtons = document.querySelectorAll(".preset-btn");
  presetButtons.forEach(btn => {
    const presetKey = btn.getAttribute("data-preset");
    const preset = PRESETS[presetKey];
    
    // Deep match compare helper
    const isMatch = preset.length === slots.length && preset.every((s, idx) => {
      return s.name === slots[idx].name && s.url === slots[idx].url;
    });

    if (isMatch) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function renderSlotsEditor() {
  slotsListContainer.innerHTML = "";
  
  slots.forEach((slot, index) => {
    const row = document.createElement("div");
    row.className = "slot-item-row";
    row.innerHTML = `
      <div class="color-picker-wrapper" style="background-color: ${slot.color};">
        <input type="color" class="color-input" value="${slot.color}" data-index="${index}">
      </div>
      <div class="inputs-container">
        <input type="text" class="text-input slot-name-input" value="${slot.name}" data-index="${index}" placeholder="Slot Name" maxlength="24">
        <input type="text" class="url-input slot-url-input" value="${slot.url}" data-index="${index}" placeholder="Apple Music URL or Embed HTML">
      </div>
      <button class="remove-btn" data-index="${index}" aria-label="Delete slot">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
    `;

    // Local events for real-time visual color feedback
    const colorInput = row.querySelector(".color-input");
    colorInput.addEventListener("input", (e) => {
      e.target.parentElement.style.backgroundColor = e.target.value;
    });

    slotsListContainer.appendChild(row);
  });
}

function addNewSlotField() {
  if (slots.length >= 24) {
    alert("Maximum limit of 24 slots reached to preserve wheel layout readability!");
    return;
  }

  // Pick sequential color
  const color = COLOR_PALETTE[slots.length % COLOR_PALETTE.length];
  slots.push({
    name: `Slot ${slots.length + 1}`,
    url: "",
    color: color
  });

  renderSlotsEditor();
  updateSlotCountBadge();
  highlightActivePreset();
  
  // Auto scroll to bottom
  slotsListContainer.scrollTop = slotsListContainer.scrollHeight;
}

function removeSlotField(index) {
  if (slots.length <= 2) {
    alert("The wheel must have at least 2 slots!");
    return;
  }
  slots.splice(index, 1);
  renderSlotsEditor();
  updateSlotCountBadge();
  highlightActivePreset();
}

function applyPreset(presetKey) {
  const preset = PRESETS[presetKey];
  if (preset) {
    slots = JSON.parse(JSON.stringify(preset)); // deep clone
    renderSlotsEditor();
    updateSlotCountBadge();
    highlightActivePreset();
  }
}

function saveDrawerSettings() {
  // Read inputs from DOM
  const nameInputs = document.querySelectorAll(".slot-name-input");
  const urlInputs = document.querySelectorAll(".slot-url-input");
  const colorInputs = document.querySelectorAll(".color-input");

  const newSlots = [];
  
  for (let i = 0; i < nameInputs.length; i++) {
    const nameVal = nameInputs[i].value.trim() || `Slot ${i + 1}`;
    const urlVal = urlInputs[i].value.trim();
    const colorVal = colorInputs[i].value;

    newSlots.push({
      name: nameVal,
      url: urlVal,
      color: colorVal
    });
  }

  slots = newSlots;
  saveState();
  
  // Redraw wheel immediately
  drawWheel();
  
  closeSettings();
  document.getElementById("statusIndicator").textContent = "CONFIG SAVED. READY!";
}

function resetToDefaultPresets() {
  if (confirm("Reset all settings to default Party Classics?")) {
    slots = JSON.parse(JSON.stringify(PRESETS.party));
    saveState();
    renderSlotsEditor();
    updateSlotCountBadge();
    highlightActivePreset();
    drawWheel();
    closeSettings();
    document.getElementById("statusIndicator").textContent = "DEFAULTS RESTORED!";
  }
}

// ==========================================================================
// 9. Sound UI Controller
// ==========================================================================
function toggleSound() {
  soundEnabled = !soundEnabled;
  synth.enabled = soundEnabled;
  saveState();
  updateSoundUI();
}

function updateSoundUI() {
  const soundToggleBtn = document.getElementById("soundToggle");
  const soundOnIcon = soundToggleBtn.querySelector(".sound-on");
  const soundOffIcon = soundToggleBtn.querySelector(".sound-off");

  if (soundEnabled) {
    soundOnIcon.classList.remove("hidden");
    soundOffIcon.classList.add("hidden");
  } else {
    soundOnIcon.classList.add("hidden");
    soundOffIcon.classList.remove("hidden");
  }
}

// ==========================================================================
// 10. Event Listeners & Bootstrapping
// ==========================================================================

// Setup click and touch elements
function initializeApp() {
  // Load State
  loadState();

  // Draw initial canvas wheel
  setupCanvasHD();

  // Core Game controls
  document.getElementById("spinBtn").addEventListener("click", spin);
  document.getElementById("soundToggle").addEventListener("click", toggleSound);

  // Settings Panel controls
  document.getElementById("settingsToggle").addEventListener("click", openSettings);
  document.getElementById("settingsClose").addEventListener("click", closeSettings);
  document.getElementById("saveSettingsBtn").addEventListener("click", saveDrawerSettings);
  document.getElementById("addSlotBtn").addEventListener("click", addNewSlotField);
  document.getElementById("resetDefaultsBtn").addEventListener("click", resetToDefaultPresets);

  // Slots delegation click handlers (for Remove buttons)
  slotsListContainer.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-btn");
    if (btn) {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      removeSlotField(idx);
    }
  });

  // Preset picker buttons click delegation
  document.querySelector(".presets-grid").addEventListener("click", (e) => {
    const btn = e.target.closest(".preset-btn");
    if (btn) {
      const presetKey = btn.getAttribute("data-preset");
      applyPreset(presetKey);
    }
  });

  // Winner modal close controls
  document.getElementById("modalClose").addEventListener("click", hideWinnerModal);
  document.getElementById("spinAgainBtn").addEventListener("click", () => {
    hideWinnerModal();
    // Tiny delay to allow modal slide-out visual transition, then spin automatically
    setTimeout(() => {
      spin();
    }, 150);
  });

  // Tap overlay backdrop to close modal or drawer
  document.getElementById("winnerModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("winnerModal")) {
      hideWinnerModal();
    }
  });

  document.getElementById("settingsDrawer").addEventListener("click", (e) => {
    if (e.target === document.getElementById("settingsDrawer")) {
      closeSettings();
    }
  });

  // iOS Safari touchstart event registration to unlock audio context instantly on first click
  const unlockAudio = () => {
    synth.init();
    synth.resume();
    document.removeEventListener("touchstart", unlockAudio);
    document.removeEventListener("click", unlockAudio);
  };
  document.addEventListener("touchstart", unlockAudio);
  document.addEventListener("click", unlockAudio);
}

// Run boot sequence when DOM parses
document.addEventListener("DOMContentLoaded", initializeApp);
