document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("nav a");
  const contentArea = document.getElementById("content-area");
  
  // Backend API URL
  const API_URL = localStorage.getItem('API_URL') || 'http://localhost:5000';

  // ==================== THEME SWITCHER ====================
  // Initialize theme from localStorage or system preference
  function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const icon = themeToggle.querySelector('i');
      if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  }

  // Wire up theme toggle button
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  }

  // Initialize theme on page load
  initializeTheme();

  // ==================== MOBILE MENU TOGGLE ====================
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      navMenu.classList.toggle('mobile-open');
    });
  }

  // Close menu when a nav link is clicked
  const navLinks = document.querySelectorAll('nav a[data-page]');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('mobile-open')) {
        navMenu.classList.remove('mobile-open');
      }
    });
  });

  // Load Home by default
  loadPage("home.html");

  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");
      const page = link.getAttribute("data-page");
      loadPage(page);
    });
  });

  function loadPage(page) {
    fetch(`pages/${page}`)
      .then(res => {
        if (!res.ok) throw new Error("Page not found");
        return res.text();
      })
      .then(data => {
        contentArea.innerHTML = data;
        // Initialize functionality when pages are loaded
        if (page === "home.html" || page === "live-capture.html") {
          initializeCameraAndUpload();
        } else if (page === "analysis.html") {
          loadAnalysisPage();
        } else if (page === "dashboard.html") {
          loadDashboard();
        } else if (page === "download.html") {
          loadDownloadPage();
        }
      })
      .catch(err => (contentArea.innerHTML = `<p style="text-align:center; color: red;">Error: ${err.message}</p>`));
  }

  // ==================== CAMERA AND FILE UPLOAD ====================
  function initializeCameraAndUpload() {
    const startCameraBtn = document.getElementById("startCameraBtn");
    const uploadSampleBtn = document.getElementById("uploadSampleBtn");
    const fileInput = document.getElementById("fileInput");
    const cameraModal = document.getElementById("cameraModal");
    const cameraFeed = document.getElementById("cameraFeed");
    const captureBtn = document.getElementById("captureBtn");
    const stopCameraBtn = document.getElementById("stopCameraBtn");
    const closeCamera = document.getElementById("closeCamera");
    const canvasCapture = document.getElementById("canvasCapture");
    const capturePreview = document.getElementById("capturePreview");
    const imageInfo = document.getElementById("imageInfo");

    let stream = null;
    let isCaptured = false;
    let capturedImageData = null;
    let capturedFilename = null; // store original filename for uploads

    // Start Camera
    if (startCameraBtn) {
      startCameraBtn.addEventListener("click", () => {
        cameraModal.classList.add("active");
        startCamera();
      });
    }

    // Upload Sample
    if (uploadSampleBtn) {
      uploadSampleBtn.addEventListener("click", () => {
        fileInput.click();
      });
    }

    // File input change event
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        // Validate that a proper image file was selected
        if (!file) {
          alert("No file selected. Please choose an image file to analyze.");
          return;
        }

        if (!file.type || !file.type.startsWith("image/")) {
          alert("Invalid file type. Please upload a valid image file (JPG, PNG, JPEG).");
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          if (!event.target.result) {
            alert("Image could not be loaded correctly. Please try uploading the image again.");
            return;
          }
          showUploadedImage(event.target.result, file);
        };
        reader.onerror = () => {
          alert("There was a problem reading the image file. Please try again with a different image.");
        };
        reader.readAsDataURL(file);
      });
    }

    // Start Camera function
    function startCamera() {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((mediaStream) => {
          stream = mediaStream;
          cameraFeed.srcObject = stream;
          isCaptured = false;
          capturePreview.style.display = "none";
          cameraFeed.style.display = "block";
          imageInfo.textContent = "";
          captureBtn.textContent = "Capture Photo";
        })
        .catch((err) => {
          alert("Unable to access camera: " + err.message);
          closeModal();
        });
    }

    // Capture Photo
    if (captureBtn) {
      captureBtn.addEventListener("click", async () => {
        if (!isCaptured) {
          const context = canvasCapture.getContext("2d");
          canvasCapture.width = cameraFeed.videoWidth;
          canvasCapture.height = cameraFeed.videoHeight;
          context.drawImage(cameraFeed, 0, 0);

          capturedImageData = canvasCapture.toDataURL("image/jpeg");
          capturePreview.src = capturedImageData;
          capturePreview.style.display = "block";
          cameraFeed.style.display = "none";

          const timestamp = new Date().toLocaleString();
          imageInfo.textContent = `Captured: ${timestamp}`;

          // Check for faces in the captured image
          const hasFace = await detectFaceInImage(capturedImageData);
          if (hasFace) {
            imageInfo.innerHTML = `<div style="color: #e74c3c; font-weight: bold; padding: 10px; background: #fadbd8; border-radius: 6px; margin-top: 10px;">⚠️ ERROR: Human face detected! Please capture only sand images without people.</div>`;
            captureBtn.textContent = "Capture Photo";
            isCaptured = false;
            capturePreview.style.display = "none";
            cameraFeed.style.display = "block";
            capturedImageData = null;
            return;
          }

          captureBtn.textContent = "Analyze Image";
          isCaptured = true;
        } else {
            // Analyze the captured image (use uploaded filename if available)
            const fname = capturedFilename || "camera_capture.jpg";
            await analyzeImage(capturedImageData, fname);
        }
      });
    }

    // Face detection using TensorFlow.js and Face-api
    async function detectFaceInImage(imageData) {
      try {
        // Load face detection model from CDN if not already loaded
        if (!window.faceapi) {
          // Load face-api.js library
          const script1 = document.createElement('script');
          script1.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js';
          document.head.appendChild(script1);
          
          await new Promise(resolve => {
            script1.onload = () => setTimeout(resolve, 1000);
          });
        }

        // Create temporary image element
        const img = new Image();
        img.src = imageData;
        
        return new Promise((resolve) => {
          img.onload = async () => {
            try {
              // Load model once
              if (!window.modelsLoaded) {
                const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
                await faceapi.nets.tinyFaceDetector.load(MODEL_URL);
                window.modelsLoaded = true;
              }

              // Detect faces
              const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
              
              // If any faces detected, return true
              if (detections && detections.length > 0) {
                console.log('Faces detected:', detections.length);
                resolve(true);
              } else {
                console.log('No faces detected');
                resolve(false);
              }
            } catch (err) {
              console.warn('Face detection error (fallback to no detection):', err.message);
              // If face detection fails, allow the image (don't block)
              resolve(false);
            }
          };
          img.onerror = () => resolve(false);
        });
      } catch (err) {
        console.warn('Face detection library error:', err.message);
        // If library fails to load, allow the image
        return false;
      }
    }

    // Stop Camera
    if (stopCameraBtn) {
      stopCameraBtn.addEventListener("click", () => {
        stopCamera();
        closeModal();
      });
    }

    // Close Camera Button
    if (closeCamera) {
      closeCamera.addEventListener("click", () => {
        stopCamera();
        closeModal();
      });
    }

    // Stop Camera function
    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
    }

    // Close Modal
    function closeModal() {
      cameraModal.classList.remove("active");
      stopCamera();
    }

    // Close modal when clicking outside
    cameraModal.addEventListener("click", (e) => {
      if (e.target === cameraModal) {
        closeModal();
      }
    });

    // Show Uploaded Image
    function showUploadedImage(imageData, file) {
      cameraModal.classList.add("active");
      cameraFeed.style.display = "none";
      capturePreview.src = imageData;
      capturePreview.style.display = "block";
      const timestamp = new Date().toLocaleString();
      imageInfo.textContent = `Uploaded: ${file.name} | ${timestamp}`;
      captureBtn.textContent = "Analyze Image";

      // store for when user clicks Analyze
      capturedImageData = imageData;
      capturedFilename = file.name;
      isCaptured = true;
      // do NOT auto-analyze; wait for user to click Analyze
    }

    // Analyze Image function
    async function analyzeImage(imageData, filename) {
      try {
        // Basic validation to ensure we actually have image data to analyze
        if (!imageData || typeof imageData !== 'string') {
          if (imageInfo) {
            imageInfo.innerHTML = `<div style="color:#e74c3c;font-weight:600;padding:10px;background:#fadbd8;border-radius:6px;margin-top:8px;">
              ⚠️ No image detected. Please capture a photo or upload an image before analyzing.
            </div>`;
          }
          console.warn('analyzeImage called without valid image data');
          return;
        }

        imageInfo.textContent = "Analyzing image...";
        console.log('Starting analysis for:', filename);
        // Show spinner and disable buttons during analysis
        let spinner = document.getElementById('analysisSpinner');
        if (!spinner) {
          spinner = document.createElement('div');
          spinner.id = 'analysisSpinner';
          spinner.style.position = 'fixed';
          spinner.style.top = '50%';
          spinner.style.left = '50%';
          spinner.style.transform = 'translate(-50%, -50%)';
          spinner.style.zIndex = 3000;
          spinner.style.padding = '14px 18px';
          spinner.style.background = 'rgba(255,255,255,0.95)';
          spinner.style.borderRadius = '10px';
          spinner.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
          spinner.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:18px;height:18px;border:3px solid rgba(0,0,0,0.08);border-top-color:var(--teal);border-radius:50%;animation:spin 1s linear infinite"></div>
              <div style="font-weight:600;color:var(--text-dark)">Analyzing...</div>
            </div>
            <div style="font-size:0.85rem;color:var(--text-light);text-align:center;">
              Hold on, analyzing your sand sample…
            </div>
          </div>`;
          document.body.appendChild(spinner);
          // add keyframes if not present
          const styleId = 'spinKeyframes';
          if (!document.getElementById(styleId)) {
            const s = document.createElement('style');
            s.id = styleId;
            s.innerHTML = `@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`;
            document.head.appendChild(s);
          }
        }
        if (captureBtn) captureBtn.disabled = true;
        if (uploadSampleBtn) uploadSampleBtn.disabled = true;
        
        // Quick connectivity check to backend
        await pingBackend();

        // Convert base64 to blob
        const blob = dataURLtoBlob(imageData);
        const formData = new FormData();
        formData.append('image', blob, filename);

        let response;
        try {
          response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            body: formData,
            mode: 'cors'
          });
        } catch (netErr) {
          console.error('Network error during fetch:', netErr);
          throw new Error(`Network error when contacting backend at ${API_URL}: ${netErr.message || netErr}`);
        }

        const text = await response.text();
        console.log('Backend response status:', response.status);
        console.log('Backend response body:', text);

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status} ${response.statusText} - ${text}`);
        }

        const result = JSON.parse(text);
        
        // Backend returns { id, filename, results: { ... } } or error
        if (result && result.error) {
          // Show error message prominently and keep modal open
          imageInfo.textContent = `❌ Error: ${result.error}`;
          console.error('Backend error:', result.error);
          return; // Stop here, don't navigate away
        }

        if (result && result.results) {
          console.log('Analysis successful:', result);
          showAnalysisResults(result.results);
          // Optionally save a lightweight local cache of the result
          saveAnalysisLocally({ id: result.id, filename: result.filename, results: result.results });
        } else {
          throw new Error('Analysis failed: unexpected response');
        }

      } catch (error) {
        imageInfo.textContent = `Error: ${error.message}`;
        console.error('Analysis error:', error);
        // Helpful hint for the user when fetch fails
        if (error.message && (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('failed to fetch') || error.message.toLowerCase().includes('connection'))) {
          imageInfo.textContent += ' — Please ensure the backend is running at ' + API_URL + ' and CORS is enabled.';
        }
      } finally {
        // cleanup spinner and re-enable buttons
        const sp = document.getElementById('analysisSpinner');
        if (sp && sp.parentElement) sp.parentElement.removeChild(sp);
        if (captureBtn) { captureBtn.disabled = false; captureBtn.textContent = 'Analyze Image'; }
        if (uploadSampleBtn) uploadSampleBtn.disabled = false;
        // reset captured filename after analysis to avoid accidental re-upload
        // (keep capturedImageData so user can re-analyze if needed)
        capturedFilename = null;
      }
    }

    // Ping backend with timeout to ensure it's reachable
    async function pingBackend(timeoutMs = 5000) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`${API_URL}/`, { method: 'GET', mode: 'cors', signal: controller.signal });
        clearTimeout(id);
        if (!res.ok) throw new Error(`Backend responded with ${res.status}`);
        return true;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    }

    // Show Analysis Results
    function showAnalysisResults(results) {
      // If camera modal is open, show results inline in the modal below the preview
      const cameraModalEl = document.getElementById('cameraModal');
      const cameraContainer = cameraModalEl ? cameraModalEl.querySelector('.camera-container') : null;

      const resultBlock = document.createElement('div');
      resultBlock.className = 'modal-analysis-result';
      resultBlock.style.marginTop = '12px';
      resultBlock.style.padding = '12px';
      resultBlock.style.background = 'var(--white)';
      resultBlock.style.borderRadius = '8px';
      resultBlock.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
      resultBlock.innerHTML = `
        <h3 style="color:var(--teal);margin:0 0 8px 0;">Analysis Result</h3>
        <div style="font-size:0.95rem;color:var(--text-dark);line-height:1.5">
          <div><strong>Fine Grains:</strong> ${Number(results.fine_grains || results.fine || 0).toFixed(2)}%</div>
          <div><strong>Medium Grains:</strong> ${Number(results.medium_grains || results.medium || 0).toFixed(2)}%</div>
          <div><strong>Coarse Grains:</strong> ${Number(results.coarse_grains || results.coarse || 0).toFixed(2)}%</div>
          <div><strong>Total Particles:</strong> ${Number(results.total_grains || results.total_particles || 0)}</div>
          <div><strong>Confidence:</strong> ${results.confidence ? `${(Number(results.confidence) * 100).toFixed(1)}%` : 'N/A'}</div>
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;">
          <button id="closeResultBtn" class="btn" style="flex:1;background:var(--teal);color:var(--white);border:none;border-radius:6px;padding:8px;">Close</button>
          <button id="viewHistoryBtn" class="btn" style="flex:1;background:var(--bg-cream);color:var(--text-dark);border:none;border-radius:6px;padding:8px;">Tap to view the analysis</button>
        </div>
      `;

      if (cameraContainer && cameraModalEl.classList.contains('active')) {
        // remove any previous result block
        const prev = cameraContainer.querySelector('.modal-analysis-result');
        if (prev) prev.remove();
        cameraContainer.appendChild(resultBlock);
        // wire buttons
        resultBlock.querySelector('#closeResultBtn').addEventListener('click', () => {
          resultBlock.remove();
        });
        resultBlock.querySelector('#viewHistoryBtn').addEventListener('click', () => {
          cameraModalEl.classList.remove('active');
          loadPage('analysis.html');
        });
      } else {
        // fallback: insert floating card in content area
        const resultsHTML = `
          <div style="position: fixed; top: 100px; right: 20px; background: var(--white); padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 2001; max-width: 350px;">
            <h3 style="color: var(--teal); margin-top: 0;">Analysis Results</h3>
                <div style="margin: 15px 0;">
                  <p style="margin: 8px 0;"><strong>Fine Grains:</strong> ${Number(results.fine_grains || results.fine || 0).toFixed(2)}%</p>
                  <p style="margin: 8px 0;"><strong>Medium Grains:</strong> ${Number(results.medium_grains || results.medium || 0).toFixed(2)}%</p>
                  <p style="margin: 8px 0;"><strong>Coarse Grains:</strong> ${Number(results.coarse_grains || results.coarse || 0).toFixed(2)}%</p>
                  <p style="margin: 8px 0;"><strong>Total Particles:</strong> ${Number(results.total_grains || results.total_particles || 0)}</p>
                  <p style="margin: 8px 0;"><strong>Avg Size:</strong> ${results.average_size ? `${Number(results.average_size).toFixed(2)}px` : 'N/A'}</p>
                  <p style="margin: 8px 0;"><strong>Confidence:</strong> ${results.confidence ? `${(Number(results.confidence) * 100).toFixed(1)}%` : 'N/A'}</p>
                </div>
            <button onclick="this.parentElement.remove()" style="width: 100%; padding: 10px; background: var(--teal); color: var(--white); border: none; border-radius: 5px; cursor: pointer;">Close</button>
          </div>
        `;
        contentArea.insertAdjacentHTML('beforeend', resultsHTML);
      }
    }

    // Save Analysis Locally
    function saveAnalysisLocally(analysis) {
      try {
        let analyses = JSON.parse(localStorage.getItem("sandVisionAnalyses")) || [];
        analyses.push({
          ...analysis,
          localId: Date.now()
        });
        if (analyses.length > 50) {
          analyses = analyses.slice(-50);
        }
        localStorage.setItem("sandVisionAnalyses", JSON.stringify(analyses));
        // remember the last analysis id so we can highlight it on the Analysis page
        if (analysis && analysis.id) {
          localStorage.setItem("sandVisionLastAnalysisId", String(analysis.id));
        }
      } catch (e) {
        console.error("Error saving analysis:", e);
      }
    }
  }

  // ==================== ANALYSIS PAGE ====================
  function loadAnalysisPage() {
    const container = document.querySelector('.feature-grid') || document.querySelector('.container');
    if (!container) return;

    // show loading and controls area (with date filters)
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;grid-column:1/-1;margin-bottom:12px;flex-wrap:wrap;">
        <div style="font-weight:600;color:var(--text-dark)">Analysis History</div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <label for="analysisStartDate" style="color:var(--text-light)">From:</label>
          <input type="date" id="analysisStartDate" style="padding:6px;border-radius:6px;border:1px solid #ddd;" />
          <label for="analysisEndDate" style="color:var(--text-light)">To:</label>
          <input type="date" id="analysisEndDate" style="padding:6px;border-radius:6px;border:1px solid #ddd;" />
          <label for="analysisSortSelect" style="margin-left:8px;color:var(--text-light)">Sort:</label>
          <select id="analysisSortSelect" style="padding:6px;border-radius:6px;border:1px solid #ddd;">
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
          <button id="analysisClearFilter" class="btn" style="padding:6px 10px;border-radius:6px;border:1px solid #ddd;background:var(--white);">Clear</button>
        </div>
      </div>
      <div id="analysisItemsContainer" style="grid-column:1/-1;">
        <p style="text-align:center;padding:24px;color:var(--text-light)">Loading analysis data...</p>
      </div>
    `;

    // Fetch data and render
    fetch(`${API_URL}/api/history?page=1&limit=200&t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const items = data && data.data ? data.data : [];
        const containerEl = document.getElementById('analysisItemsContainer');
        const sortSelect = document.getElementById('analysisSortSelect');
        const lastAnalysisId = localStorage.getItem("sandVisionLastAnalysisId");

        function renderItems(sortOrder = 'desc') {
          if (!items || items.length === 0) {
            containerEl.innerHTML = '<p style="text-align: center; padding: 40px;">No analyses yet. Start by uploading or capturing an image!</p>';
            return;
          }
          // apply date filters
          const startVal = document.getElementById('analysisStartDate').value;
          const endVal = document.getElementById('analysisEndDate').value;
          let filtered = items.slice();
          if (startVal) {
            const startTime = new Date(startVal).setHours(0,0,0,0);
            filtered = filtered.filter(a => (new Date(a.created_at || a.analysis_date || a.createdAt || 0).getTime()) >= startTime);
          }
          if (endVal) {
            const endTime = new Date(endVal).setHours(23,59,59,999);
            filtered = filtered.filter(a => (new Date(a.created_at || a.analysis_date || a.createdAt || 0).getTime()) <= endTime);
          }

          const sorted = filtered.slice().sort((a, b) => {
            const da = new Date(a.created_at || a.analysis_date || a.createdAt || 0).getTime();
            const db = new Date(b.created_at || b.analysis_date || b.createdAt || 0).getTime();
            return sortOrder === 'asc' ? da - db : db - da;
          });

          const html = sorted.map(analysis => {
            const isLast = lastAnalysisId && String(analysis.id) === String(lastAnalysisId);
            const highlightStyle = isLast ? 'box-shadow: 0 0 0 2px var(--teal); border-radius: 10px; position: relative;' : '';
            const badge = isLast
              ? '<span style="position:absolute;top:10px;right:12px;background:var(--teal);color:var(--white);font-size:0.7rem;padding:3px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:0.05em;">Just analyzed</span>'
              : '';
            return `
            <div class="feature-card" data-analysis-id="${analysis.id}" style="${highlightStyle}">
              ${badge}
              <h3>${analysis.filename}</h3>
              <p><strong>Fine:</strong> ${Number(analysis.fine_grains || analysis.fine_percentage || analysis.fine || 0).toFixed(2)}%</p>
              <p><strong>Medium:</strong> ${Number(analysis.medium_grains || analysis.medium_percentage || analysis.medium || 0).toFixed(2)}%</p>
              <p><strong>Coarse:</strong> ${Number(analysis.coarse_grains || analysis.coarse_percentage || analysis.coarse || 0).toFixed(2)}%</p>
              <p style="font-size: 0.9rem; color: #999;">${new Date(analysis.created_at || analysis.analysis_date || analysis.createdAt || Date.now()).toLocaleString()}</p>
              <button type="button" class="btn delete-analysis-btn" data-id="${analysis.id}" style="margin-top:8px;background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:0.85rem;">Delete analysis</button>
            </div>`;
          }).join('');

          containerEl.innerHTML = html;

          // wire up delete buttons
          const deleteButtons = containerEl.querySelectorAll('.delete-analysis-btn');
          deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const id = btn.getAttribute('data-id');
              deleteAnalysisById(id, () => {
                // after delete, reload the analysis page so list is refreshed
                loadPage('analysis.html');
              });
            });
          });
        }

        // initial render
        renderItems(sortSelect.value);

        // handle sort changes
        sortSelect.addEventListener('change', () => renderItems(sortSelect.value));
        // wire up date inputs and clear button for analysis filters
        const analysisStart = document.getElementById('analysisStartDate');
        const analysisEnd = document.getElementById('analysisEndDate');
        const analysisClear = document.getElementById('analysisClearFilter');
        if (analysisStart) analysisStart.addEventListener('change', () => renderItems(sortSelect.value));
        if (analysisEnd) analysisEnd.addEventListener('change', () => renderItems(sortSelect.value));
        if (analysisClear) analysisClear.addEventListener('click', (e) => { e.preventDefault(); if (analysisStart) analysisStart.value = ''; if (analysisEnd) analysisEnd.value = ''; renderItems(sortSelect.value); });
      })
      .catch(err => {
        console.error('Error loading analysis data:', err);
        const containerEl = document.getElementById('analysisItemsContainer');
        if (containerEl) containerEl.innerHTML = `<p style="text-align: center; color: red;">Error loading data: ${err.message}</p>`;
      });
  }

  // ==================== DASHBOARD ====================
  function loadDashboard() {
    const container = document.querySelector('.feature-grid') || document.querySelector('.container');
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;grid-column:1/-1;margin-bottom:12px;flex-wrap:wrap;">
        <div style="font-weight:600;color:var(--text-dark)">Dashboard</div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <label for="dashboardStartDate" style="color:var(--text-light)">From:</label>
          <input type="date" id="dashboardStartDate" style="padding:6px;border-radius:6px;border:1px solid #ddd;" />
          <label for="dashboardEndDate" style="color:var(--text-light)">To:</label>
          <input type="date" id="dashboardEndDate" style="padding:6px;border-radius:6px;border:1px solid #ddd;" />
          <label for="dashboardSortSelect" style="margin-left:8px;color:var(--text-light)">Sort:</label>
          <select id="dashboardSortSelect" style="padding:6px;border-radius:6px;border:1px solid #ddd;">
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
          <button id="dashboardClearFilter" class="btn" style="padding:6px 10px;border-radius:6px;border:1px solid #ddd;background:var(--white);">Clear</button>
        </div>
      </div>
      <div id="dashboardStatsContainer" style="grid-column:1/-1;text-align:center;padding:20px;">Loading statistics...</div>
    `;

    Promise.all([
      fetch(`${API_URL}/api/statistics?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`${API_URL}/api/history?page=1&limit=200&t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json())
    ])
      .then(([stats, history]) => {
        const sortSelect = document.getElementById('dashboardSortSelect');
        const statsContainer = document.getElementById('dashboardStatsContainer');
        const items = history && history.data ? history.data : [];

        function renderDashboard(sortOrder = 'desc') {
          let html = '';
          if (stats && typeof stats.total_analyses !== 'undefined') {
            html += `
              <div class="feature-card">
                <h3>📊 Total Analyses</h3>
                <p style="font-size: 2rem; color: var(--teal); font-weight: bold;">${stats.total_analyses}</p>
              </div>
              <div class="feature-card">
                <h3>🟤 Avg Fine Grains</h3>
                <p style="font-size: 2rem; color: var(--accent-gold); font-weight: bold;">${Number(stats.average_fine || 0).toFixed(2)}%</p>
              </div>
              <div class="feature-card">
                <h3>🟠 Avg Medium Grains</h3>
                <p style="font-size: 2rem; color: var(--teal); font-weight: bold;">${Number(stats.average_medium || 0).toFixed(2)}%</p>
              </div>
              <div class="feature-card">
                <h3>⭕ Avg Coarse Grains</h3>
                <p style="font-size: 2rem; color: var(--sand-dark); font-weight: bold;">${Number(stats.average_coarse || 0).toFixed(2)}%</p>
              </div>
            `;
          } else {
            html += '<p style="text-align:center; padding: 40px;">No statistics available yet.</p>';
          }

          html += `<div style="grid-column: 1/-1; margin-top: 30px;">
            <canvas id="analysisChart" width="800" height="320" style="max-width:100%;"></canvas>
          </div>
          <div id="dashboardRecentAnalyses" style="grid-column:1/-1;margin-top:24px;text-align:left;">
            <h3 style="margin-bottom:10px;color:var(--text-dark);">Recent Analyses</h3>
            <div id="dashboardRecentAnalysesList"></div>
          </div>`;

          statsContainer.innerHTML = html;

          // apply date filters for dashboard chart
          const startVal = document.getElementById('dashboardStartDate') ? document.getElementById('dashboardStartDate').value : '';
          const endVal = document.getElementById('dashboardEndDate') ? document.getElementById('dashboardEndDate').value : '';
          let filtered = items.slice();
          if (startVal) {
            const startTime = new Date(startVal).setHours(0,0,0,0);
            filtered = filtered.filter(a => (new Date(a.created_at || a.analysis_date || a.createdAt || 0).getTime()) >= startTime);
          }
          if (endVal) {
            const endTime = new Date(endVal).setHours(23,59,59,999);
            filtered = filtered.filter(a => (new Date(a.created_at || a.analysis_date || a.createdAt || 0).getTime()) <= endTime);
          }

          const sorted = filtered.slice().sort((a, b) => {
            const da = new Date(a.created_at || a.analysis_date || a.createdAt || 0).getTime();
            const db = new Date(b.created_at || b.analysis_date || b.createdAt || 0).getTime();
            return sortOrder === 'asc' ? da - db : db - da;
          });

          // render recent analyses list with delete buttons
          const listContainer = document.getElementById('dashboardRecentAnalysesList');
          if (listContainer) {
            if (sorted.length === 0) {
              listContainer.innerHTML = '<p style="color:var(--text-light);">No analyses available yet.</p>';
            } else {
              const recent = sorted.slice(0, 10);
              listContainer.innerHTML = recent.map(a => `
                <div class="feature-card" data-analysis-id="${a.id}" style="margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                  <div>
                    <div style="font-weight:600;">${a.filename}</div>
                    <div style="font-size:0.85rem;color:var(--text-light);">
                      Fine: ${Number(a.fine_grains || a.fine_percentage || 0).toFixed(2)}% |
                      Medium: ${Number(a.medium_grains || a.medium_percentage || 0).toFixed(2)}% |
                      Coarse: ${Number(a.coarse_grains || a.coarse_percentage || 0).toFixed(2)}%
                    </div>
                    <div style="font-size:0.8rem;color:#999;">${new Date(a.created_at || a.analysis_date || a.createdAt || 0).toLocaleString()}</div>
                  </div>
                  <button type="button" class="btn delete-analysis-btn" data-id="${a.id}" style="background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:0.8rem;white-space:nowrap;">Delete</button>
                </div>
              `).join('');

              const deleteButtons = listContainer.querySelectorAll('.delete-analysis-btn');
              deleteButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const id = btn.getAttribute('data-id');
                  deleteAnalysisById(id, () => {
                    // after delete, reload the dashboard so stats, chart and list are refreshed
                    loadPage('dashboard.html');
                  });
                });
              });
            }
          }

          if (sorted.length > 0 && window.Chart) {
            const ctx = document.getElementById('analysisChart').getContext('2d');
            const labels = sorted.map(a => new Date(a.created_at || a.analysis_date || Date.now()).toLocaleDateString());
            const fine = sorted.map(a => Number(a.fine_grains || a.fine_percentage || 0));
            const medium = sorted.map(a => Number(a.medium_grains || a.medium_percentage || 0));
            const coarse = sorted.map(a => Number(a.coarse_grains || a.coarse_percentage || 0));
            // destroy existing chart if present
            if (window._sandVisionChart) {
              try { window._sandVisionChart.destroy(); } catch (e) { /* ignore */ }
            }
            window._sandVisionChart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels,
                datasets: [
                  { label: 'Fine (%)', data: fine, backgroundColor: 'rgba(212,160,23,0.7)', borderColor: '#D4A017', borderWidth: 1 },
                  { label: 'Medium (%)', data: medium, backgroundColor: 'rgba(193,154,107,0.7)', borderColor: '#C19A6B', borderWidth: 1 },
                  { label: 'Coarse (%)', data: coarse, backgroundColor: 'rgba(107,76,59,0.7)', borderColor: '#6B4C3B', borderWidth: 1 }
                ]
              },
              options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Sand Grain Composition Over Time' } }, scales: { x: { stacked: true }, y: { beginAtZero: true, max: 100, stacked: true } } }
            });
          }
        }

        // initial render using selected sort
        renderDashboard(sortSelect.value);
        sortSelect.addEventListener('change', () => renderDashboard(sortSelect.value));
          // wire up date inputs and sort
          const dashboardStart = document.getElementById('dashboardStartDate');
          const dashboardEnd = document.getElementById('dashboardEndDate');
          if (dashboardStart) dashboardStart.addEventListener('change', () => renderDashboard(sortSelect.value));
          if (dashboardEnd) dashboardEnd.addEventListener('change', () => renderDashboard(sortSelect.value));
          // wire up clear button for dashboard filters
          const dashboardClear = document.getElementById('dashboardClearFilter');
          if (dashboardClear) dashboardClear.addEventListener('click', (e) => { e.preventDefault(); if (dashboardStart) dashboardStart.value = ''; if (dashboardEnd) dashboardEnd.value = ''; renderDashboard(sortSelect.value); });
      })
      .catch(err => {
        container.innerHTML = `<p style="text-align: center; color: red;">Error loading dashboard: ${err.message}</p>`;
      });
  }

  // ==================== DOWNLOAD PAGE ====================
  function loadDownloadPage() {
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    const downloadCSVBtn = document.getElementById('downloadCSVBtn');

    if (downloadReportBtn) {
      downloadReportBtn.addEventListener('click', selectImageForReport);
    }

    if (downloadCSVBtn) {
      downloadCSVBtn.addEventListener('click', (e) => {
        e.preventDefault();
        generateCSVExport();
      });
    }
  }

  // Generate CSV export from history data
  function generateCSVExport() {
    fetch(`${API_URL}/api/history?page=1&limit=500&t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const analyses = data.data || [];
        
        if (analyses.length === 0) {
          alert('No analysis data available. Please analyze some sand images first.');
          return;
        }

        // CSV headers
        const headers = ['Analysis ID', 'Filename', 'Fine Grains (%)', 'Medium Grains (%)', 'Coarse Grains (%)', 'Total Particles', 'Analysis Date', 'Timestamp'];
        
        // CSV rows
        const rows = analyses.map(analysis => [
          analysis.id || '',
          analysis.filename || '',
          (Number(analysis.fine_grains || 0).toFixed(2)).toString(),
          (Number(analysis.medium_grains || 0).toFixed(2)).toString(),
          (Number(analysis.coarse_grains || 0).toFixed(2)).toString(),
          analysis.total_grains || '0',
          new Date(analysis.created_at || analysis.analysis_date || 0).toLocaleString(),
          new Date(analysis.created_at || analysis.analysis_date || 0).toISOString()
        ]);

        // Build CSV content
        let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';
        csvContent += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        // Add summary section
        csvContent += '\n\n---,SUMMARY STATISTICS\n';
        csvContent += `Total Analyses,${analyses.length}\n`;
        
        const avgFine = analyses.reduce((sum, a) => sum + Number(a.fine_grains || 0), 0) / analyses.length;
        const avgMedium = analyses.reduce((sum, a) => sum + Number(a.medium_grains || 0), 0) / analyses.length;
        const avgCoarse = analyses.reduce((sum, a) => sum + Number(a.coarse_grains || 0), 0) / analyses.length;
        
        csvContent += `Average Fine Grains,${avgFine.toFixed(2)}\n`;
        csvContent += `Average Medium Grains,${avgMedium.toFixed(2)}\n`;
        csvContent += `Average Coarse Grains,${avgCoarse.toFixed(2)}\n`;
        csvContent += `Export Date,${new Date().toLocaleString()}\n`;

        // Create and download file
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
        element.setAttribute('download', `SandVision_Analysis_Export_${new Date().toISOString().split('T')[0]}.csv`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        alert(`CSV exported successfully! (${analyses.length} records)`);
      })
      .catch(err => {
        console.error('Error exporting CSV:', err);
        alert('Failed to export CSV. Please try again.');
      });
  }

  // Select image for report generation
  function selectImageForReport() {
    fetch(`${API_URL}/api/history?page=1&limit=100`)
      .then(res => res.json())
      .then(data => {
        const analyses = data.data || [];
        
        if (analyses.length === 0) {
          alert('No analyses available. Please analyze some sand images first.');
          return;
        }

        // Create selection dialog
        let options = '<div style="padding: 20px; max-height: 400px; overflow-y: auto;">';
        options += '<h3>Select an Image for Report:</h3>';
        options += '<div style="display: grid; gap: 10px; margin-top: 15px;" id="analysisListContainer">';
        
        analyses.forEach((analysis, index) => {
          const date = new Date(analysis.created_at).toLocaleString();
          options += `
            <div class="analysis-item" data-id="${analysis.id}" data-filename="${analysis.filename}" data-fine="${analysis.fine_grains}" data-medium="${analysis.medium_grains}" data-coarse="${analysis.coarse_grains}" style="padding: 15px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; transition: all 0.3s;">
              <strong>${index + 1}. ${analysis.filename}</strong><br>
              <small style="color: var(--text-light);">Fine: ${analysis.fine_grains}% | Medium: ${analysis.medium_grains}% | Coarse: ${analysis.coarse_grains}%</small><br>
              <small style="color: var(--text-light);">${date}</small>
            </div>
          `;
        });

        options += '</div>';
        options += `<div style="margin-top: 15px;"><small style="color: var(--text-light);">Click on any image to generate its detailed report</small></div>`;
        options += '</div>';

        // Show modal with image selection
        const modal = document.createElement('div');
        modal.id = 'reportSelectionModal';
        modal.style.cssText = `
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
          z-index: 10000;
        `;
        modal.innerHTML = `
          <div style="background: white; padding: 0; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;">
            <div style="padding: 20px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: white;">
              <h2 style="margin: 0;">Select Image</h2>
              <button id="closeModalBtn" style="border: none; font-size: 24px; cursor: pointer; background: none; color: #999;">&times;</button>
            </div>
            ${options}
          </div>
        `;
        document.body.appendChild(modal);

        // Close modal button
        document.getElementById('closeModalBtn').addEventListener('click', () => {
          modal.remove();
        });

        // Add click handlers to analysis items
        document.querySelectorAll('.analysis-item').forEach(item => {
          item.addEventListener('mouseover', () => {
            item.style.backgroundColor = '#f0f0f0';
            item.style.borderColor = '#48dbfb';
          });
          item.addEventListener('mouseout', () => {
            item.style.backgroundColor = 'white';
            item.style.borderColor = '#ddd';
          });
          item.addEventListener('click', (e) => {
            const analysisId = item.getAttribute('data-id');
            const filename = item.getAttribute('data-filename');
            const fineGrains = parseFloat(item.getAttribute('data-fine'));
            const mediumGrains = parseFloat(item.getAttribute('data-medium'));
            const coarseGrains = parseFloat(item.getAttribute('data-coarse'));
            
            modal.remove();
            generateDetailedPDFReport(analysisId, filename, fineGrains, mediumGrains, coarseGrains);
          });
        });
      })
      .catch(err => {
        console.error('Error fetching analyses:', err);
        alert('Failed to load analyses. Please try again.');
      });
  }

  // Generate detailed PDF report for specific image
  function generateDetailedPDFReport(analysisId, filename, fineGrains, mediumGrains, coarseGrains) {
    // Close the modal
    const modal = document.querySelector('div[style*="background: rgba(0,0,0,0.5)"]');
    if (modal) modal.remove();

    // Calculate total grains
    const totalGrains = fineGrains + mediumGrains + coarseGrains;

    // Determine sand type and characteristics
    let sandType = 'Mixed Sand';
    let characteristics = '';
    let recommendations = '';

    if (fineGrains > mediumGrains && fineGrains > coarseGrains) {
      sandType = 'Fine Sand Dominant';
      characteristics = `
CHARACTERISTICS:
✓ Softer, smoother beach surface
✓ Better for recreation and tourism
✓ Higher water retention capacity
✓ Prone to compaction and erosion
✓ Fine particle size (< 0.25mm)`;
      recommendations = `
RECOMMENDATIONS:
→ Implement coastal erosion protection measures
→ Monitor regularly for sediment loss
→ Best for: Beaches, recreational areas
→ NOT suitable for construction/concrete`;
    } else if (mediumGrains > fineGrains && mediumGrains > coarseGrains) {
      sandType = 'Medium Sand Dominant';
      characteristics = `
CHARACTERISTICS:
✓ Ideal for construction purposes
✓ Good balance of stability and aesthetics
✓ Medium particle size (0.25 - 0.5mm)
✓ Good drainage properties
✓ Stable beach structure`;
      recommendations = `
RECOMMENDATIONS:
→ EXCELLENT for construction projects
→ Suitable for concrete and mortar mixing
→ Good for infrastructure development
→ Stable for long-term use`;
    } else {
      sandType = 'Coarse Sand Dominant';
      characteristics = `
CHARACTERISTICS:
✓ Rougher beach surface
✓ Strong wave resistance
✓ Better drainage capabilities
✓ Coarse particle size (0.5 - 1.0mm)
✓ Stable foundation properties`;
      recommendations = `
RECOMMENDATIONS:
→ Good for structural applications
→ Suitable for road base and drainage
→ Excellent wave resistance
→ Ideal for areas with strong currents`;
    }

    // Create HTML content for PDF
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 900px;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 3px solid #C19A6B; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #6B4C3B; margin: 0;">SANDVISION</h1>
          <p style="color: #6B5A4F; margin: 5px 0 0 0;">Beach Sand Grain Analysis Report</p>
        </div>

        <!-- Summary -->
        <div style="background: #FBF7F0; padding: 15px; border-left: 4px solid #C19A6B; margin-bottom: 25px;">
          <p><strong>Analysis ID:</strong> ${analysisId}</p>
          <p><strong>Image File:</strong> ${filename}</p>
          <p><strong>Analysis Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Sand Type:</strong> ${sandType}</p>
        </div>

        <!-- Grain Composition -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #6B4C3B; border-bottom: 2px solid #C19A6B; padding-bottom: 10px;">Sand Grain Composition</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background: #E9DFC6;">
              <th style="border: 1px solid #C19A6B; padding: 10px; text-align: left;">Grain Type</th>
              <th style="border: 1px solid #C19A6B; padding: 10px; text-align: right;">Percentage</th>
              <th style="border: 1px solid #C19A6B; padding: 10px;">Visual</th>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;"><strong>Fine Grains</strong> (&lt;0.25mm)</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;"><strong>${fineGrains.toFixed(2)}%</strong></td>
              <td style="border: 1px solid #ddd; padding: 10px;"><div style="background: linear-gradient(90deg, #D4A017 0%, transparent ${fineGrains}%); height: 20px; border-radius: 3px;"></div></td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;"><strong>Medium Grains</strong> (0.25-0.5mm)</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;"><strong>${mediumGrains.toFixed(2)}%</strong></td>
              <td style="border: 1px solid #ddd; padding: 10px;"><div style="background: linear-gradient(90deg, #C19A6B 0%, transparent ${mediumGrains}%); height: 20px; border-radius: 3px;"></div></td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;"><strong>Coarse Grains</strong> (0.5-1.0mm)</td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;"><strong>${coarseGrains.toFixed(2)}%</strong></td>
              <td style="border: 1px solid #ddd; padding: 10px;"><div style="background: linear-gradient(90deg, #6B4C3B 0%, transparent ${coarseGrains}%); height: 20px; border-radius: 3px;"></div></td>
            </tr>
          </table>
        </div>

        <!-- Beach Erosion Monitoring -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #6B4C3B; border-bottom: 2px solid #C19A6B; padding-bottom: 10px;">🟤 Beach Erosion Monitoring</h2>
          <p><strong>Erosion Risk Assessment:</strong></p>
          <p>${fineGrains > 60 ? 
            '⚠️ HIGH RISK - Fine sand content is very high (' + fineGrains.toFixed(2) + '%). This indicates significant erosion vulnerability.' : 
            fineGrains > 40 ? 
            '⚡ MODERATE RISK - Balanced sand composition with moderate erosion potential.' : 
            '✓ LOW RISK - Coarse sand dominance provides strong natural erosion resistance.'}</p>
          <p><strong>Beach Stability:</strong> ${coarseGrains > 50 ? 'EXCELLENT' : mediumGrains > 50 ? 'GOOD' : 'FAIR - Requires monitoring'}</p>
        </div>

        <!-- Construction Suitability -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #6B4C3B; border-bottom: 2px solid #C19A6B; padding-bottom: 10px;">🟤 Construction Suitability Analysis</h2>
          <p><strong>Construction Verdict:</strong></p>
          <p>${mediumGrains > 50 ? 
            '✓ EXCELLENT - This sand is IDEAL for most construction projects' : 
            mediumGrains > 35 ? 
            '⚡ ACCEPTABLE - Can be used with proper mixture design' : 
            '⚠️ LIMITED - Requires supplementary sand for construction use'}</p>
          <p><strong>Quality Score:</strong> ${(mediumGrains * 2 + coarseGrains * 1.5 - fineGrains * 0.5).toFixed(0)}/100</p>
          <p><strong>Suitable Applications:</strong></p>
          <ul>
            <li>${fineGrains > 40 ? 'Fine filters, landscaping, backfill materials' : 'Limited uses for fine applications'}</li>
            <li>${mediumGrains > 40 ? 'Concrete mixing, mortar, foundation fill, structural projects' : 'Supplementary use in construction'}</li>
            <li>${coarseGrains > 40 ? 'Drainage systems, road base, bulk fill, drainage filters' : 'Limited drainage applications'}</li>
          </ul>
        </div>

        <!-- Beach Conditions -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #6B4C3B; border-bottom: 2px solid #C19A6B; padding-bottom: 10px;">🟤 Beach Condition Predictions</h2>
          <p><strong>Beach Type:</strong> ${fineGrains > 60 ? 
            'SOFT BEACH - Fine, smooth surface ideal for tourism and recreation' : 
            coarseGrains > 60 ? 
            'ROUGH BEACH - Coarse surface with strong structural integrity' : 
            'BALANCED BEACH - Mixed properties suitable for multiple uses'}</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background: #E9DFC6;">
              <th style="border: 1px solid #C19A6B; padding: 10px; text-align: left;">Assessment</th>
              <th style="border: 1px solid #C19A6B; padding: 10px; text-align: left;">Rating</th>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;">Safety Level</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${coarseGrains > 50 ? '★★★★★ EXCELLENT' : mediumGrains > 50 ? '★★★★☆ GOOD' : '★★★☆☆ FAIR'}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;">Walkability</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${fineGrains > 50 ? '★★★★★ EXCELLENT' : '★★★★☆ GOOD'}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;">Wave Resistance</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${coarseGrains > 50 ? 'STRONG' : 'MODERATE'}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;">Tourism Potential</td>
              <td style="border: 1px solid #ddd; padding: 10px;">${fineGrains > 50 ? 'HIGH' : 'MODERATE'}</td>
            </tr>
          </table>
        </div>

        <!-- Recommendations -->
        <div style="background: #E9DFC6; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #6B4C3B; margin-top: 0;">Recommendations</h3>
          ${recommendations.replace(/\n/g, '<br/>')}
          <p style="margin-top: 15px;"><strong>Long-term Strategies:</strong></p>
          <ol>
            <li>Establish baseline data and monitor regularly (quarterly)</li>
            <li>Track seasonal and annual variations in composition</li>
            <li>Compare with historical records for trend analysis</li>
            <li>Implement early warning systems for erosion events</li>
            <li>Develop contingency plans based on detected trends</li>
          </ol>
        </div>

        <!-- Footer -->
        <div style="border-top: 2px solid #C19A6B; padding-top: 15px; color: #6B5A4F; font-size: 12px; text-align: center;">
          <p>SandVision AI Analysis Platform | Beach Sand Grain Classification System</p>
          <p>Grain Size Classification (Wentworth Scale): Fine (&lt;0.25mm) | Medium (0.25-0.5mm) | Coarse (0.5-1.0mm)</p>
          <p style="margin-top: 10px; font-style: italic;">This report is generated based on image analysis. For critical applications, validate with field observations and consult coastal engineers.</p>
        </div>
      </div>
    `;

    // Generate PDF using html2pdf
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    const options = {
      margin: 10,
      filename: `SandVision_Report_${filename.replace(/\.[^/.]+$/, "")}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
    alert('PDF Report generated and downloaded successfully!');
  }

  // ==================== SHARED HELPERS ====================
  function showInlineMessage(message, type = 'error') {
    if (!message) return;
    let bar = document.getElementById('sandvisionGlobalMessage');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'sandvisionGlobalMessage';
      bar.style.position = 'fixed';
      bar.style.bottom = '20px';
      bar.style.left = '50%';
      bar.style.transform = 'translateX(-50%)';
      bar.style.zIndex = '5000';
      bar.style.padding = '10px 16px';
      bar.style.borderRadius = '8px';
      bar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      bar.style.fontSize = '0.9rem';
      bar.style.maxWidth = '90%';
      bar.style.textAlign = 'center';
      document.body.appendChild(bar);
    }
    bar.textContent = message;
    if (type === 'error') {
      bar.style.background = '#fadbd8';
      bar.style.color = '#c0392b';
      bar.style.border = '1px solid #e74c3c';
    } else {
      bar.style.background = '#e8f8f5';
      bar.style.color = '#148f77';
      bar.style.border = '1px solid #1abc9c';
    }

    if (window._sandvisionMessageTimer) {
      clearTimeout(window._sandvisionMessageTimer);
    }
    window._sandvisionMessageTimer = setTimeout(() => {
      if (bar && bar.parentElement) {
        bar.parentElement.removeChild(bar);
      }
    }, 3500);
  }

  function showConfirmModal(message, onYes, onNo) {
    // remove any existing modal
    const existing = document.getElementById('sandvisionConfirmModal');
    if (existing && existing.parentElement) existing.parentElement.removeChild(existing);

    const overlay = document.createElement('div');
    overlay.id = 'sandvisionConfirmModal';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.45)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '6000';

    overlay.innerHTML = `
      <div style="background:var(--white);padding:18px 20px;border-radius:10px;max-width:320px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.25);">
        <div style="font-weight:600;margin-bottom:8px;color:var(--text-dark);">Confirm delete</div>
        <div style="font-size:0.9rem;color:var(--text-light);margin-bottom:14px;">${message}</div>
        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button type="button" id="svCancelDelete" class="btn" style="background:var(--bg-cream);color:var(--text-dark);border:none;border-radius:6px;padding:6px 12px;font-size:0.85rem;">No</button>
          <button type="button" id="svConfirmDelete" class="btn" style="background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:0.85rem;">Yes, delete</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = () => {
      if (overlay && overlay.parentElement) {
        overlay.parentElement.removeChild(overlay);
      }
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        if (typeof onNo === 'function') onNo();
      }
    });

    overlay.querySelector('#svCancelDelete').addEventListener('click', () => {
      cleanup();
      if (typeof onNo === 'function') onNo();
    });

    overlay.querySelector('#svConfirmDelete').addEventListener('click', () => {
      cleanup();
      if (typeof onYes === 'function') onYes();
    });
  }

  function deleteAnalysisById(id, onSuccess) {
    if (!id) return;

    showConfirmModal(
      'Are you sure you want to delete this analysis? This action cannot be undone.',
      () => {
        fetch(`${API_URL}/api/delete/${id}`, {
          method: 'DELETE',
          mode: 'cors'
        })
          .then(res => res.json().then(body => ({ ok: res.ok, status: res.status, body })))
          .then(({ ok, status, body }) => {
            if (!ok) {
              const msg = body && body.error ? body.error : `Failed with status ${status}`;
              console.error('Failed to delete analysis:', msg);
              showInlineMessage('Failed to delete analysis: ' + msg, 'error');
              return;
            }
            // If we just deleted the "last highlighted" analysis, clear that marker
            const lastId = localStorage.getItem('sandVisionLastAnalysisId');
            if (lastId && String(lastId) === String(id)) {
              localStorage.removeItem('sandVisionLastAnalysisId');
            }
            showInlineMessage('Analysis deleted successfully.', 'success');
            if (typeof onSuccess === 'function') {
              onSuccess();
            }
          })
          .catch(err => {
            console.error('Error deleting analysis:', err);
            showInlineMessage('Error deleting analysis: ' + (err.message || err), 'error');
          });
      },
      () => {
        // user clicked No; nothing else to do
      }
    );
  }


  // ==================== UTILITY FUNCTIONS ====================
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // API Configuration
  window.API = {
    URL: API_URL,
    setURL: (url) => {
      localStorage.setItem('API_URL', url);
      location.reload();
    }
  };
});
