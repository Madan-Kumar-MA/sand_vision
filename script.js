document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("nav a");
  const contentArea = document.getElementById("content-area");

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
        // Initialize camera and file upload functionality when home page is loaded
        if (page === "home.html") {
          initializeCameraAndUpload();
        }
      })
      .catch(err => (contentArea.innerHTML = `<p style="text-align:center;">${err.message}</p>`));
  }

  // Camera and File Upload Functionality
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
            showUploadedImage(event.target.result, file.name);
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
      captureBtn.addEventListener("click", () => {
        if (!isCaptured) {
          const context = canvasCapture.getContext("2d");
          canvasCapture.width = cameraFeed.videoWidth;
          canvasCapture.height = cameraFeed.videoHeight;
          context.drawImage(cameraFeed, 0, 0);

          const imageData = canvasCapture.toDataURL("image/jpeg");
          capturePreview.src = imageData;
          capturePreview.style.display = "block";
          cameraFeed.style.display = "none";

          const timestamp = new Date().toLocaleString();
          imageInfo.textContent = `Captured: ${timestamp}`;

          captureBtn.textContent = "Capture Again";
          isCaptured = true;

          // Save to localStorage
          saveImageToLocalStorage(imageData, timestamp);
        } else {
          capturePreview.style.display = "none";
          cameraFeed.style.display = "block";
          imageInfo.textContent = "";
          captureBtn.textContent = "Capture Photo";
          isCaptured = false;
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
    function showUploadedImage(imageData, fileName) {
      cameraModal.classList.add("active");
      cameraFeed.style.display = "none";
      capturePreview.src = imageData;
      capturePreview.style.display = "block";
      const timestamp = new Date().toLocaleString();
      imageInfo.textContent = `Uploaded: ${fileName} | ${timestamp}`;
      captureBtn.textContent = "Analyze Image";

      // Save to localStorage
      saveImageToLocalStorage(imageData, `${fileName} - ${timestamp}`);
    }

    // Save Image to LocalStorage
    function saveImageToLocalStorage(imageData, label) {
      try {
        let images = JSON.parse(localStorage.getItem("sandVisionImages")) || [];
        images.push({
          data: imageData,
          label: label,
          timestamp: new Date().toISOString()
        });
        // Keep only last 10 images
        if (images.length > 10) {
          images = images.slice(-10);
        }
        localStorage.setItem("sandVisionImages", JSON.stringify(images));
        console.log("Image saved successfully");
      } catch (e) {
        console.error("Error saving image:", e);
      }
    }
  }
});
