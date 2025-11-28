document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("nav a");
  const contentArea = document.getElementById("content-area");
  
  // Backend API URL
  const API_URL = localStorage.getItem('API_URL') || 'http://localhost:5000';

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
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            showUploadedImage(event.target.result, file);
          };
          reader.readAsDataURL(file);
        }
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

          captureBtn.textContent = "Analyze Image";
          isCaptured = true;
        } else {
          // Analyze the captured image
          await analyzeImage(capturedImageData, "camera_capture.jpg");
        }
      });
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
      
      capturedImageData = imageData;
      isCaptured = true;

      // Auto-analyze on image selection immediately (no delay)
      analyzeImage(imageData, file.name).catch(err => console.error(err));
    }

    // Analyze Image function
    async function analyzeImage(imageData, filename) {
      try {
        imageInfo.textContent = "Analyzing image...";
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

        if (!response.ok) {
          const text = await response.text().catch(() => null);
          throw new Error(`Analysis failed: ${response.status} ${response.statusText} ${text ? '- ' + text : ''}`);
        }

        const result = await response.json();
        
        // Backend returns { id, filename, results: { ... } } or error
        if (result && result.error) {
          // Show error message prominently and keep modal open
          imageInfo.textContent = `❌ Error: ${result.error}`;
          console.error('Backend error:', result.error);
          return; // Stop here, don't navigate away
        }

        if (result && result.results) {
          showAnalysisResults(result.results);
          // Optionally save a lightweight local cache of the result
          saveAnalysisLocally({ id: result.id, filename: result.filename, results: result.results });
          // After successful analysis, navigate to the analysis page so user can see full history (longer delay)
          setTimeout(() => loadPage('analysis.html'), 2000);
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
      closeModal();
      
      const resultsHTML = `
        <div style="position: fixed; top: 100px; right: 20px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 2001; max-width: 350px;">
          <h3 style="color: #009688; margin-top: 0;">Analysis Results</h3>
              <div style="margin: 15px 0;">
                <p style="margin: 8px 0;"><strong>Fine Grains:</strong> ${Number(results.fine_grains || results.fine || 0).toFixed(2)}%</p>
                <p style="margin: 8px 0;"><strong>Medium Grains:</strong> ${Number(results.medium_grains || results.medium || 0).toFixed(2)}%</p>
                <p style="margin: 8px 0;"><strong>Coarse Grains:</strong> ${Number(results.coarse_grains || results.coarse || 0).toFixed(2)}%</p>
                <p style="margin: 8px 0;"><strong>Total Particles:</strong> ${Number(results.total_grains || results.total_particles || 0)}</p>
                <p style="margin: 8px 0;"><strong>Avg Size:</strong> ${results.average_size ? `${Number(results.average_size).toFixed(2)}px` : 'N/A'}</p>
                <p style="margin: 8px 0;"><strong>Confidence:</strong> ${results.confidence ? `${(Number(results.confidence) * 100).toFixed(1)}%` : 'N/A'}</p>
              </div>
          <button onclick="this.parentElement.remove()" style="width: 100%; padding: 10px; background: #009688; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
        </div>
      `;
      
      contentArea.insertAdjacentHTML('beforeend', resultsHTML);
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
      } catch (e) {
        console.error("Error saving analysis:", e);
      }
    }
  }

  // ==================== ANALYSIS PAGE ====================
  function loadAnalysisPage() {
    const container = document.querySelector('.feature-grid') || document.querySelector('.container');
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; padding: 40px;">Loading analysis data...</p>';

    fetch(`${API_URL}/api/history?page=1&limit=10`)
      .then(res => res.json())
      .then(data => {
        // Backend returns { data: [...], page, limit, total }
        const items = data && data.data ? data.data : [];
        if (items.length > 0) {
          const html = items.map(analysis => `
            <div class="feature-card">
              <h3>${analysis.filename}</h3>
              <p><strong>Fine:</strong> ${Number(analysis.fine_grains || analysis.fine_percentage || analysis.fine || 0).toFixed(2)}%</p>
              <p><strong>Medium:</strong> ${Number(analysis.medium_grains || analysis.medium_percentage || analysis.medium || 0).toFixed(2)}%</p>
              <p><strong>Coarse:</strong> ${Number(analysis.coarse_grains || analysis.coarse_percentage || analysis.coarse || 0).toFixed(2)}%</p>
              <p style="font-size: 0.9rem; color: #999;">${new Date(analysis.created_at || analysis.analysis_date || analysis.createdAt || Date.now()).toLocaleString()}</p>
            </div>
          `).join('');
          container.innerHTML = html;
        } else {
          container.innerHTML = '<p style="text-align: center; padding: 40px;">No analyses yet. Start by uploading or capturing an image!</p>';
        }
      })
      .catch(err => {
        container.innerHTML = `<p style="text-align: center; color: red;">Error loading data: ${err.message}</p>`;
      });
  }

  // ==================== DASHBOARD ====================
  function loadDashboard() {
    const container = document.querySelector('.feature-grid') || document.querySelector('.container');
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; padding: 40px;">Loading statistics...</p>';

    Promise.all([
      fetch(`${API_URL}/api/statistics`).then(r => r.json()),
      fetch(`${API_URL}/api/history?page=1&limit=100`).then(r => r.json())
    ])
      .then(([stats, history]) => {
        // stats: { total_analyses, average_fine, average_medium, average_coarse }
        let html = '';
        if (stats && typeof stats.total_analyses !== 'undefined') {
          html += `
            <div class="feature-card">
              <h3>📊 Total Analyses</h3>
              <p style="font-size: 2rem; color: #009688; font-weight: bold;">${stats.total_analyses}</p>
            </div>
            <div class="feature-card">
              <h3>🟤 Avg Fine Grains</h3>
              <p style="font-size: 2rem; color: #FF9800; font-weight: bold;">${Number(stats.average_fine || 0).toFixed(2)}%</p>
            </div>
            <div class="feature-card">
              <h3>🟠 Avg Medium Grains</h3>
              <p style="font-size: 2rem; color: #FFC107; font-weight: bold;">${Number(stats.average_medium || 0).toFixed(2)}%</p>
            </div>
            <div class="feature-card">
              <h3>⭕ Avg Coarse Grains</h3>
              <p style="font-size: 2rem; color: #8B4513; font-weight: bold;">${Number(stats.average_coarse || 0).toFixed(2)}%</p>
            </div>
          `;
        } else {
          html += '<p style="text-align:center; padding: 40px;">No statistics available yet.</p>';
        }

        // Add chart for analyzed data
        html += `<div style="grid-column: 1/-1; margin-top: 30px;">
          <canvas id="analysisChart" width="800" height="320" style="max-width:100%;"></canvas>
        </div>`;
        container.innerHTML = html;

        // Render chart if there is data
        const items = history && history.data ? history.data : [];
        if (items.length > 0 && window.Chart) {
          const ctx = document.getElementById('analysisChart').getContext('2d');
          const labels = items.map(a => new Date(a.created_at || a.analysis_date || Date.now()).toLocaleDateString());
          const fine = items.map(a => Number(a.fine_grains || a.fine_percentage || 0));
          const medium = items.map(a => Number(a.medium_grains || a.medium_percentage || 0));
          const coarse = items.map(a => Number(a.coarse_grains || a.coarse_percentage || 0));
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels,
              datasets: [
                {
                  label: 'Fine (%)',
                  data: fine,
                  backgroundColor: 'rgba(0,150,136,0.7)',
                  borderColor: '#009688',
                  borderWidth: 1
                },
                {
                  label: 'Medium (%)',
                  data: medium,
                  backgroundColor: 'rgba(255,193,7,0.7)',
                  borderColor: '#FFC107',
                  borderWidth: 1
                },
                {
                  label: 'Coarse (%)',
                  data: coarse,
                  backgroundColor: 'rgba(139,69,19,0.7)',
                  borderColor: '#8B4513',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Sand Grain Composition Over Time' }
              },
              scales: {
                x: { stacked: true },
                y: { beginAtZero: true, max: 100, stacked: true }
              }
            }
          });
        }
      })
      .catch(err => {
        container.innerHTML = `<p style="text-align: center; color: red;">Error loading dashboard: ${err.message}</p>`;
      });
  }

  // ==================== DOWNLOAD PAGE ====================
  function loadDownloadPage() {
    const btnGroup = document.querySelector('.btn-group');
    if (!btnGroup) return;

    const pdfBtn = btnGroup.querySelector('.primary-btn');
    const csvBtn = btnGroup.querySelector('.secondary-btn');

    if (pdfBtn) {
      pdfBtn.onclick = (e) => {
        e.preventDefault();
        window.open(`${API_URL}/api/export/json`, '_blank');
      };
    }

    if (csvBtn) {
      csvBtn.onclick = (e) => {
        e.preventDefault();
        window.location.href = `${API_URL}/api/export/csv`;
      };
    }
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
