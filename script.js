// Grab references to main elements
const simulationArea = document.getElementById('simulation-area');
const mergeModal = document.getElementById('mergeModal');
const mergeYesBtn = document.getElementById('mergeYes');
const mergeCancelBtn = document.getElementById('mergeCancel');
const knownParticlesModal = document.getElementById('knownParticlesModal');
const knownParticlesBtn = document.getElementById('knownParticlesButton');
const closeKnownParticlesBtn = document.getElementById('closeKnownParticles');
const sparklesInfoModal = document.getElementById('sparklesInfoModal');
const sparklesInfoBtn = document.getElementById('sparklesInfoButton');
const closeSparklesInfoBtn = document.getElementById('closeSparklesInfo');
const clearBoardBtn = document.getElementById('clearButton');
const sparklesContainer = document.getElementById('sparkles-container');

// Store references to all draggable quarks/particles
let draggables = [];
// For the modal: track which two items we’re about to merge
let mergeCandidates = { item1: null, item2: null };

/**
 * Sorts an array of quarks/antiquarks in alphabetical order, then joins with '+'.
 * This ensures any permutation is recognized as the same composition.
 */
function canonicalizeQuarks(arr) {
  return arr.slice().sort().join('+');
}

/**
 * Known compositions (in sorted form) -> Particle info
 */
const knownParticlesMap = {
  // Mesons (2 quarks)
  "Anti-Down+Down": { name: "π0", cssClass: "pi-zero" },
  "Anti-Down+Up":   { name: "π+",  cssClass: "pi-plus" },
  "Anti-Up+Down":   { name: "π-",  cssClass: "pi-minus" },
  "Anti-Up+Up":     { name: "π0",  cssClass: "pi-zero" },
  "Anti-Charm+Charm": { name: "J/ψ", cssClass: "jpsi" },
  "Anti-Strange+Strange": { name: "φ", cssClass: "phi" },

  // Baryons (3 quarks)
  "Down+Down+Down": { name: "Delta-", cssClass: "delta-minus" },
  "Down+Down+Up":   { name: "Neutron", cssClass: "neutron" },
  "Down+Strange+Up":{ name: "Lambda", cssClass: "lambda" },
  "Down+Up+Up":     { name: "Proton", cssClass: "proton" },
  "Up+Up+Up":       { name: "Delta++", cssClass: "delta-plus-plus" },
};

// ----------------- CREATE QUARKS -----------------

document.querySelectorAll('.create-quark').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.getAttribute('data-type');
    createQuark(type);
  });
});

/**
 * Creates a new quark in the simulation area.
 * @param {string} type - e.g. "Up", "Down", "Anti-Strange"
 */
function createQuark(type) {
  const quark = document.createElement('div');
  quark.classList.add('draggable', 'quark');
  quark.dataset.type = type;
  quark.textContent = type;

  // Random initial position
  const rect = simulationArea.getBoundingClientRect();
  const x = Math.random() * (rect.width - 60);
  const y = Math.random() * (rect.height - 60);
  quark.style.left = x + 'px';
  quark.style.top = y + 'px';

  enableDragging(quark);
  simulationArea.appendChild(quark);
  draggables.push(quark);
}

// ----------------- DRAGGING LOGIC -----------------

function enableDragging(element) {
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  element.addEventListener('mousedown', (e) => {
    isDragging = true;
    element.style.zIndex = 9999;
    const rect = element.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const simRect = simulationArea.getBoundingClientRect();
    let left = e.clientX - simRect.left - offsetX;
    let top = e.clientY - simRect.top - offsetY;
    element.style.left = left + 'px';
    element.style.top = top + 'px';
  });

  document.addEventListener('mouseup', (e) => {
    if (isDragging) {
      isDragging = false;
      // On drop, check if close enough to merge
      checkForMerge(element);
    }
  });
}

/**
 * Checks if an element (on drop) is close enough to any other element to prompt a merge.
 */
function checkForMerge(element) {
  if (!mergeModal.classList.contains('hidden')) return;

  const rect1 = element.getBoundingClientRect();
  for (let other of draggables) {
    if (other === element) continue;
    const rect2 = other.getBoundingClientRect();
    const center1 = {
      x: rect1.left + rect1.width / 2,
      y: rect1.top + rect1.height / 2
    };
    const center2 = {
      x: rect2.left + rect2.width / 2,
      y: rect2.top + rect2.height / 2
    };
    const dist = Math.hypot(center1.x - center2.x, center1.y - center2.y);

    if (dist < 50) {
      mergeCandidates.item1 = element;
      mergeCandidates.item2 = other;
      showMergeModal();
      break;
    }
  }
}

// ----------------- MERGING LOGIC -----------------

function showMergeModal() {
  mergeModal.classList.remove('hidden');
}

mergeYesBtn.addEventListener('click', () => {
  mergeModal.classList.add('hidden');
  mergeItems(mergeCandidates.item1, mergeCandidates.item2);
  mergeCandidates.item1 = null;
  mergeCandidates.item2 = null;
});

mergeCancelBtn.addEventListener('click', () => {
  mergeModal.classList.add('hidden');
  mergeCandidates.item1 = null;
  mergeCandidates.item2 = null;
});

/**
 * Merges two draggable items into a new particle.
 * @param {HTMLElement} item1 
 * @param {HTMLElement} item2 
 */
function mergeItems(item1, item2) {
  // Capture positions before removal
  const rect1 = item1.getBoundingClientRect();
  const rect2 = item2.getBoundingClientRect();
  const simRect = simulationArea.getBoundingClientRect();

  // Build combined composition
  let comp1 = item1.dataset.composition || item1.dataset.type;
  let comp2 = item2.dataset.composition || item2.dataset.type;
  let compArr1 = comp1.split('+');
  let compArr2 = comp2.split('+');
  let mergedArray = compArr1.concat(compArr2);

  if (mergedArray.length > 5) {
    alert("Cannot merge: resulting particle would exceed 5 constituents!");
    return;
  }

  // Canonical form so permutations match known map
  const newKey = canonicalizeQuarks(mergedArray);

  // Remove old items from DOM & tracking
  item1.remove();
  item2.remove();
  draggables = draggables.filter(el => el !== item1 && el !== item2);

  // Create the new merged particle
  const newParticle = document.createElement('div');
  newParticle.classList.add('draggable', 'particle');
  newParticle.dataset.composition = mergedArray.join('+'); // For display

  // Check if recognized
  const knownInfo = knownParticlesMap[newKey];
  if (knownInfo) {
    newParticle.textContent = knownInfo.name + " : " + mergedArray.join('+');
    newParticle.classList.add(knownInfo.cssClass);
  } else {
    newParticle.textContent = "Unknown : " + mergedArray.join('+');
  }

  // Position at midpoint
  const center1X = rect1.left + rect1.width / 2;
  const center1Y = rect1.top + rect1.height / 2;
  const center2X = rect2.left + rect2.width / 2;
  const center2Y = rect2.top + rect2.height / 2;
  const midX = (center1X + center2X) / 2;
  const midY = (center1Y + center2Y) / 2;

  newParticle.style.left = (midX - simRect.left) + 'px';
  newParticle.style.top = (midY - simRect.top) + 'px';
  newParticle.style.transform = 'translate(-50%, -50%)';

  enableDragging(newParticle);
  simulationArea.appendChild(newParticle);
  draggables.push(newParticle);
}

// ----------------- CLEAR BOARD -----------------
clearBoardBtn.addEventListener('click', () => {
  draggables.forEach(el => el.remove());
  draggables = [];
});

// ----------------- KNOWN PARTICLES MODAL -----------------
knownParticlesBtn.addEventListener('click', () => {
  knownParticlesModal.classList.remove('hidden');
});
closeKnownParticlesBtn.addEventListener('click', () => {
  knownParticlesModal.classList.add('hidden');
});

// ----------------- SPARKLES INFO MODAL -----------------
sparklesInfoBtn.addEventListener('click', () => {
  sparklesInfoModal.classList.remove('hidden');
});
closeSparklesInfoBtn.addEventListener('click', () => {
  sparklesInfoModal.classList.add('hidden');
});

// ----------------- SPARKLES FUNCTIONALITY -----------------

function createSparkle(x, y) {
  const sparkle = document.createElement('div');
  sparkle.classList.add('sparkle');
  sparkle.style.left = x + 'px';
  sparkle.style.top = y + 'px';

  // Each sparkle has a random animation delay & duration
  sparkle.style.animationDelay = Math.random() * 5 + 's';         // up to 5s delay
  sparkle.style.animationDuration = (10 + Math.random() * 10) + 's'; // 10-20s total

  sparklesContainer.appendChild(sparkle);

  // Live for 30 seconds
  setTimeout(() => {
    sparkle.remove();
  }, 30000);
}

function generateRandomSparkle() {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  createSparkle(x, y);
}

// Large initial batch so it’s not empty
for (let i = 0; i < 50; i++) {
  generateRandomSparkle();
}

// Generate new sparkles every 2s
setInterval(generateRandomSparkle, 2000);
