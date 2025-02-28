document.addEventListener("DOMContentLoaded", function() {
    const simulationArea = document.getElementById("simulation-area");
    const createButtons = document.querySelectorAll(".create-quark");
    const clearButton = document.getElementById("clearButton");
    const knownParticlesButton = document.getElementById("knownParticlesButton");
    const sparklesInfoButton = document.getElementById("sparklesInfoButton");
  
    // Modal elements
    const mergeModal = document.getElementById("mergeModal");
    const mergeYesButton = document.getElementById("mergeYes");
    const mergeCancelButton = document.getElementById("mergeCancel");
    const knownParticlesModal = document.getElementById("knownParticlesModal");
    const closeKnownParticles = document.getElementById("closeKnownParticles");
    const sparklesInfoModal = document.getElementById("sparklesInfoModal");
    const closeSparklesInfo = document.getElementById("closeSparklesInfo");
  
    // Global merge flag and candidate
    let mergeInProgress = false;
    let mergeCandidate = { elem1: null, elem2: null };
  
    // Attach event listeners for create buttons
    createButtons.forEach(button => {
      button.addEventListener("click", function() {
        const type = button.getAttribute("data-type");
        createQuark(type);
      });
    });
  
    // Clear board functionality
    clearButton.addEventListener("click", function() {
      simulationArea.innerHTML = "";
      hideMergeModal();
      mergeInProgress = false;
    });
  
    // Known Particles modal functionality
    knownParticlesButton.addEventListener("click", function() {
      knownParticlesModal.classList.remove("hidden");
    });
    closeKnownParticles.addEventListener("click", function() {
      knownParticlesModal.classList.add("hidden");
    });
  
    // Sparkles Info modal functionality
    sparklesInfoButton.addEventListener("click", function() {
      sparklesInfoModal.classList.remove("hidden");
    });
    closeSparklesInfo.addEventListener("click", function() {
      sparklesInfoModal.classList.add("hidden");
    });
  
    // Merge Modal event listeners
    mergeYesButton.addEventListener("click", function() {
      if (mergeCandidate.elem1 && mergeCandidate.elem2) {
        mergeElements(mergeCandidate.elem1, mergeCandidate.elem2);
      }
      hideMergeModal();
      mergeInProgress = false;
      mergeCandidate = { elem1: null, elem2: null };
    });
    mergeCancelButton.addEventListener("click", function() {
      hideMergeModal();
      mergeInProgress = false;
      mergeCandidate = { elem1: null, elem2: null };
    });
  
    function hideMergeModal() {
      mergeModal.classList.add("hidden");
    }
    function showMergeModal(elem1, elem2) {
      mergeCandidate.elem1 = elem1;
      mergeCandidate.elem2 = elem2;
      mergeModal.classList.remove("hidden");
    }
  
    // Generate sparkles (neutrino-like sparkles)
    function generateSparkles() {
      const sparklesContainer = document.getElementById("sparkles-container");
      const sparkleCount = 30;
      for (let i = 0; i < sparkleCount; i++) {
        const sparkle = document.createElement("div");
        sparkle.classList.add("sparkle");
        // Set random initial position
        sparkle.style.top = Math.random() * 100 + "%";
        sparkle.style.left = Math.random() * 100 + "%";
        // Set random animation duration and delay
        const duration = Math.random() * 3 + 3; // 3 to 6 seconds
        const delay = Math.random() * 5; // 0 to 5 seconds
        sparkle.style.animationDuration = duration + "s";
        sparkle.style.animationDelay = delay + "s";
        sparklesContainer.appendChild(sparkle);
      }
    }
    generateSparkles();
  
    // Function to apply a random slight wobble animation to an element
    function applyWobble(element) {
      const duration = (Math.random() * 2 + 3).toFixed(2) + "s"; // between 3 and 5 seconds
      const delay = (Math.random() * 2).toFixed(2) + "s"; // between 0 and 2 seconds
      element.style.animation = `wobble ${duration} ease-in-out ${delay} infinite`;
    }
  
    // Function to create a quark element
    function createQuark(type) {
      const quark = document.createElement("div");
      quark.classList.add("draggable", "quark");
      quark.textContent = type;
      // Store the composition as a JSON array (starts with one quark)
      quark.dataset.composition = JSON.stringify([type]);
  
      // Place the quark at a random position within the simulation area
      const areaRect = simulationArea.getBoundingClientRect();
      const x = Math.random() * (areaRect.width - 50);
      const y = Math.random() * (areaRect.height - 50);
      quark.style.left = x + "px";
      quark.style.top = y + "px";
  
      simulationArea.appendChild(quark);
      applyWobble(quark);
      makeDraggable(quark);
    }
  
    // Enable drag-and-drop for a given element
    function makeDraggable(element) {
      let offsetX = 0;
      let offsetY = 0;
      let isDragging = false;
  
      element.addEventListener("mousedown", function(e) {
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        element.style.zIndex = 1000; // Bring to front
        // Pause wobble during drag
        element.style.animationPlayState = "paused";
      });
  
      document.addEventListener("mousemove", function(e) {
        if (isDragging) {
          const areaRect = simulationArea.getBoundingClientRect();
          let x = e.clientX - areaRect.left - offsetX;
          let y = e.clientY - areaRect.top - offsetY;
          // Constrain movement within the simulation area
          x = Math.max(0, Math.min(x, areaRect.width - element.offsetWidth));
          y = Math.max(0, Math.min(y, areaRect.height - element.offsetHeight));
          element.style.left = x + "px";
          element.style.top = y + "px";
        }
      });
  
      document.addEventListener("mouseup", function(e) {
        if (isDragging) {
          isDragging = false;
          element.style.zIndex = "";
          element.style.animationPlayState = "running"; // Resume wobble
          // Check for merge if no merge modal is already active
          if (!mergeInProgress) {
            checkForMerge(element);
          }
        }
      });
    }
  
    // When an element is dropped, check for nearby draggable elements (collision detection)
    function checkForMerge(element) {
      const draggables = document.querySelectorAll(".draggable");
      const threshold = 50; // Merge if centers are within 50px
      const elemRect = element.getBoundingClientRect();
      const elemCenter = {
        x: elemRect.left + elemRect.width / 2,
        y: elemRect.top + elemRect.height / 2
      };
  
      for (let other of draggables) {
        if (other === element) continue;
        const otherRect = other.getBoundingClientRect();
        const otherCenter = {
          x: otherRect.left + otherRect.width / 2,
          y: otherRect.top + otherRect.height / 2
        };
        const distance = Math.hypot(elemCenter.x - otherCenter.x, elemCenter.y - otherCenter.y);
        if (distance < threshold) {
          mergeInProgress = true;
          showMergeModal(element, other);
          break;
        }
      }
    }
  
    // Merge two elements (which can be free quarks or already merged particles)
    function mergeElements(elem1, elem2) {
      // Parse their compositions (each is an array of quark types, e.g., "Up", "Anti-Down", etc.)
      const comp1 = JSON.parse(elem1.dataset.composition);
      const comp2 = JSON.parse(elem2.dataset.composition);
  
      // Ensure that the total number of quarks does not exceed 5
      if (comp1.length + comp2.length > 5) {
        alert("Cannot merge: exceeds maximum of 5 quarks per particle.");
        return;
      }
  
      // Check if a new merged particle would be created.
      // (A free quark has class "quark" only; a merged group has class "particle".)
      const isElem1Particle = elem1.classList.contains("particle");
      const isElem2Particle = elem2.classList.contains("particle");
      if (!isElem1Particle && !isElem2Particle) {
        const currentParticles = document.querySelectorAll(".particle").length;
        if (currentParticles >= 5) {
          alert("Maximum number of particles reached.");
          return;
        }
      }
      
      // Combine the compositions
      const newComp = comp1.concat(comp2);
      const particleName = getParticleName(newComp);
  
      // Calculate the new element's position (average of the two positions)
      const rect1 = elem1.getBoundingClientRect();
      const rect2 = elem2.getBoundingClientRect();
      const areaRect = simulationArea.getBoundingClientRect();
      const newX = ((rect1.left + rect2.left) / 2) - areaRect.left;
      const newY = ((rect1.top + rect2.top) / 2) - areaRect.top;
  
      // Remove the merged elements from the simulation area
      if (elem1.parentNode) elem1.parentNode.removeChild(elem1);
      if (elem2.parentNode) elem2.parentNode.removeChild(elem2);
  
      // Create the new merged particle element
      const newElem = document.createElement("div");
      newElem.classList.add("draggable", "particle");
      // Always show the particle's name and its full quark composition
      newElem.textContent = particleName + " (" + newComp.join(", ") + ")";
      newElem.dataset.composition = JSON.stringify(newComp);
      newElem.style.left = newX + "px";
      newElem.style.top = newY + "px";
  
      // If the particle is known, add a specific CSS class to change its color and glow.
      if (particleName !== "unknown" && particleName !== "unknown meson" && particleName !== "unknown baryon") {
        const particleClassMap = {
          "π+": "pi-plus",
          "π-": "pi-minus",
          "π0": "pi-zero",
          "J/ψ": "jpsi",
          "φ": "phi",
          "Proton": "proton",
          "Neutron": "neutron",
          "Delta++": "delta-plus-plus",
          "Delta-": "delta-minus",
          "Lambda": "lambda"
        };
        if (particleClassMap[particleName]) {
          newElem.classList.add(particleClassMap[particleName]);
        }
      }
  
      simulationArea.appendChild(newElem);
      applyWobble(newElem);
      makeDraggable(newElem);
    }
  
    // Determine the particle name based on its quark composition.
    // Valid mesons (2 items: one quark and one antiquark) and baryons (3 items: all quarks) are recognized.
    // All other combinations (including 4 or 5) are labeled as "unknown".
    function getParticleName(composition) {
      // MESONS: Exactly 2 items with one being an antiquark.
      if (composition.length === 2) {
        const hasAnti = composition.some(q => q.startsWith("Anti-"));
        const hasQuark = composition.some(q => !q.startsWith("Anti-"));
        if (hasAnti && hasQuark) {
          if (composition.includes("Up") && composition.includes("Anti-Down")) {
            return "π+";
          }
          if (composition.includes("Down") && composition.includes("Anti-Up")) {
            return "π-";
          }
          if ((composition.includes("Up") && composition.includes("Anti-Up")) ||
              (composition.includes("Down") && composition.includes("Anti-Down"))) {
            return "π0";
          }
          if (composition.includes("Charm") && composition.includes("Anti-Charm")) {
            return "J/ψ";
          }
          if (composition.includes("Strange") && composition.includes("Anti-Strange")) {
            return "φ";
          }
          return "unknown meson";
        }
      }
  
      // BARYONS: Exactly 3 items and all are quarks (no antiquarks)
      if (composition.length === 3 && composition.every(q => !q.startsWith("Anti-"))) {
        const sorted = composition.slice().sort();
        const key = sorted.join(",");
        if (key === ["Down", "Up", "Up"].sort().join(",")) {
          return "Proton";
        }
        if (key === ["Down", "Down", "Up"].sort().join(",")) {
          return "Neutron";
        }
        if (key === ["Up", "Up", "Up"].sort().join(",")) {
          return "Delta++";
        }
        if (key === ["Down", "Down", "Down"].sort().join(",")) {
          return "Delta-";
        }
        if (key === ["Down", "Strange", "Up"].sort().join(",")) {
          return "Lambda";
        }
        return "unknown baryon";
      }
  
      return "unknown";
    }
  });
  
