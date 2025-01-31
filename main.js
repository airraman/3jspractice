// =========================================
// Imports and Initial Setup
// =========================================
import * as THREE from 'three'
import './style.css'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import vertexShader from './shaders/vertex.glsl?raw'
import fragmentShader from './shaders/fragment.glsl?raw'
import atmosphereVertex from './shaders/atmosphereVertex.glsl?raw'
import atmosphereFragment from './shaders/atmosphereFragment.glsl?raw'
import AudioMotionAnalyzer from 'audiomotion-analyzer'

// =========================================
// Global Configuration
// =========================================
const MaterialStates = {
  default: {
    color: '#FF4B6C',  // Vibrant pink-red
    opacity: 0.8,
    scale: 1
  },
  hover: {
    color: '#FFFFFF',  // Pure white
    opacity: 1,
    scale: 1.5
  },
  active: {
    color: '#FFD700',  // Bright gold
    opacity: 1,
    scale: 1.8
  }
}

const musicLibary = {
  paris: "/paris.mp3",
  sydney: "/skyclub.mp3",
  brooklyn: "/yachtclub.mp3",
  london: "/memorylane.mp3",
  lisbon: "/lisbon.mp3",
  oakland: "/oakland.mp3"
}

const locations = [
  {
    lat: 48.8566,   // Paris
    lng: 2.3522,
    Title: "6am in Paris",
    Location: "paris",
    audio: musicLibary.paris,
    img: "/img/albumImages/paris.png"
  },
  {
    lat: 51.5074,   // London
    lng: -0.1278,
    Title: "memory lane",
    Location: "london",
    audio: musicLibary.london,
    img: "/img/albumImages/london.jpg"
  },
  {
    lat: 38.7223,   // Lisbon
    lng: -9.1393,
    Title: "summer in lisbon",
    Location: "lisbon",
    audio: musicLibary.lisbon,
    img: "/img/albumImages/lisbon.jpg"
  },
  {
    lat: 40.6782,   // Brooklyn
    lng: -73.9442,
    Title: "bushwick yacht club",
    Location: "bushwick",
    audio: musicLibary.brooklyn,
    img: "/img/albumImages/bushwick.png"
  },
  {
    lat: 37.8044,   // Oakland
    lng: -122.2712,
    Title: "somewhere out in oakland",
    Location: "LA",
    audio: musicLibary.oakland,
    img: "/img/albumImages/oakland.png"
  },
  {
    lat: -33.8688,  // Sydney
    lng: 151.2093,
    Title: "skyclub",
    Location: "sydney",
    audio: musicLibary.sydney,
    img: "/img/albumImages/sydney.png"
  }
]

let userAuthState = {
  isLoggedIn: false,
  phone: null,
  lastLoginTimestamp: null
};

const form = document.getElementById('myForm');
const backdrop = document.querySelector('.backdrop');
const subscriptionDialog = document.getElementById('subscriptionDialog');
const API_URL = '/api';

function initializeUI() {
  const popUpElement = document.getElementById('popUpElement');
  const songTitle = document.querySelector('#songTitle');
  const songLocation = document.querySelector('#songLocation');
  
  // Ensure everything is hidden initially
  popUpElement.style.display = "none";
  songTitle.textContent = "";
  songLocation.textContent = "";
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp)

//Initialize App is where all of the functions of the globe are stored, including interactivity

function initializeApp() {

  const savedAuthState = localStorage.getItem('userAuthState');
  if (savedAuthState) {
    userAuthState = JSON.parse(savedAuthState);
  }

  // Hide form and backdrop initially

  if (backdrop) backdrop.style.display = 'none';
  if (form) form.style.display = 'none';

  function updateUIBasedOnAuth() {
    const musicInteractiveElements = document.querySelectorAll('.album-cover');
    const audioPlayer = document.getElementById('song');

    function handleMusicInteraction(e) {
      if (!userAuthState.isLoggedIn) {
        e.preventDefault();
        e.stopPropagation();
        backdrop.style.display = 'block';
        form.style.display = 'block';
      }
    }

    function preventAudioPlayback(e) {
      if (!userAuthState.isLoggedIn) {
        e.preventDefault();
        e.stopPropagation();
        if (audioPlayer.play) {
          audioPlayer.pause(); // Make sure audio doesn't play
        }
        backdrop.style.display = 'block';
        form.style.display = 'block';
        return false;
      }
    }

    if(userAuthState.isLoggedIn) {
      // Enable audio player
      audioPlayer.classList.remove('audio-disabled');
      audioPlayer.removeEventListener('play', preventAudioPlayback, true);
      audioPlayer.removeEventListener('playing', preventAudioPlayback, true);
      audioPlayer.removeEventListener('click', handleMusicInteraction, true);

      // Remove other interaction blockers
      musicInteractiveElements.forEach(el => {
        el.removeEventListener('click', handleMusicInteraction);
      });
      backdrop.style.display = 'none';
      form.style.display = 'none';
    } else {
      // Set up audio player interaction handling
      audioPlayer.classList.add('audio-disabled');
      audioPlayer.pause(); // Ensure audio is paused initially

      // Add event listeners to handle both click for form display and play prevention
      audioPlayer.addEventListener('click', handleMusicInteraction);
      audioPlayer.addEventListener('play', preventAudioPlayback, true);
      audioPlayer.addEventListener('playing', preventAudioPlayback, true);

      // Add other interaction blockers
      musicInteractiveElements.forEach(el => {
        el.addEventListener('click', handleMusicInteraction);
      });

      // Initially hide form and backdrop
      backdrop.style.display = 'none';
      form.style.display = 'none';
    }
  }

  // Make sure to add this event listener for the audio player itself
  document.getElementById('song').addEventListener('click', function (e) {
    if (!userAuthState.isLoggedIn) {
      e.preventDefault();
      backdrop.style.display = 'block';
      form.style.display = 'block';
    }
  });

  // Function to handle login state
  function updateLoginState(isLoggedIn, phoneNumber = null) {
    userAuthState = {
      isLoggedIn,
      phone: phoneNumber,
      lastLoginTimestamp: Date.now()
    };
    localStorage.setItem('userAuthState', JSON.stringify(userAuthState));
    updateUIBasedOnAuth();
  }

  let audioContext = null
  let analyser = null
  let audioSource = null
  // =========================================
  // DOM Elements Setup
  // =========================================
  const canvas = document.querySelector('.webgl')
  if (!canvas) {
    console.error('Required canvas element is missing')
    return
  }

  const recordPlayer = document.getElementById('song')
  const songTitle = document.querySelector('#songTitle')
  const songLocation = document.querySelector('#songLocation')
  const loadingIndicator = document.getElementById('loading-indicator')
  const popUpElement = document.getElementById('popUpElement')


  // Audio visualization canvas
  const visualizerCanvas = document.getElementById('canvas')
  if (visualizerCanvas) {
    visualizerCanvas.width = window.innerWidth
    visualizerCanvas.height = window.innerHeight
  }

  function updateSongDisplay() {
    const isPlaying = !recordPlayer.paused && recordPlayer.currentTime > 0;
    const textbox = document.querySelector('.textbox .innertext');
    const popUpElement = document.getElementById('popUpElement');
    const songTitle = document.querySelector('#songTitle');
    const songLocation = document.querySelector('#songLocation');
  
    if (!isPlaying) {
      // When no song is playing, only show "Select a city"
      textbox.textContent = "Select a city";
      popUpElement.style.display = "none";
      songTitle.textContent = "";
      songLocation.textContent = "";
    } else {
      // When a song is playing, only show song information
      textbox.textContent = "";
      const currentTrack = locations.find(loc => recordPlayer.src.includes(loc.audio));
      if (currentTrack) {
        popUpElement.style.display = "block";
        songTitle.textContent = `Song: ${currentTrack.Title}`;
        songLocation.textContent = `Location: ${currentTrack.Location}`;
      }
    }
  }

  function playSong() {
    // If we already have an audio context, reuse it
    if (!audioContext) {
      audioContext = new AudioContext();
      audioSource = audioContext.createMediaElementSource(recordPlayer);
      analyser = audioContext.createAnalyser();
      audioSource.connect(analyser);
      analyser.connect(audioContext.destination);
    }

    updateSongDisplay()

    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const ctx = visualizerCanvas.getContext("2d")
    const WIDTH = visualizerCanvas.width
    const HEIGHT = visualizerCanvas.height
    const barWidth = (WIDTH / bufferLength)

    // Inside your renderFrame function in playSong()
    function renderFrame() {
      requestAnimationFrame(renderFrame)

      analyser.getByteFrequencyData(dataArray)
      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, WIDTH, HEIGHT)

      // Calculate average frequency for atmosphere color
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const averageFrequency = sum / bufferLength
      const normalizedFrequency = Math.min(Math.max(averageFrequency / 128, 0), 1)

      // Update atmosphere color
      atmosphere.material.uniforms.mixRatio.value = normalizedFrequency

      // Draw visualization bars
      let x = 0
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] * 2.5
        const r = barHeight + (0 * (i / bufferLength))
        const g = 120 * (i / bufferLength)
        const b = 86

        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight)
        x += barWidth + .001
      }
    }

    renderFrame()
  }

  // =========================================
  // Audio Loading Manager
  // =========================================
  const AudioLoadingManager = {
    loadingIndicator,

    showLoading() {
      if (this.loadingIndicator) {
        this.loadingIndicator.classList.remove('loading-hidden')
      }
    },

    hideLoading() {
      if (this.loadingIndicator) {
        this.loadingIndicator.classList.add('loading-hidden')
      }
    },

    updateLoadingProgress(progress) {
      if (this.loadingIndicator) {
        const text = this.loadingIndicator.querySelector('.loading-text')
        if (text) {
          text.textContent = `Loading track... ${Math.round(progress)}%`
        }
      }
    }
  }

  // =========================================
  // Three.js Scene Setup
  // =========================================
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    100,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  )

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)

  // =========================================
  // Globe Creation
  // =========================================
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(5, 50, 50),
    new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        globeTexture: {
          value: new THREE.TextureLoader().load('/img/globe.jpeg')
        }
      }
    })
  );

  // Initial sphere rotation
  sphere.rotation.y = -Math.PI / 2

  // Atmosphere effect
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(6, 50, 50),
    new THREE.ShaderMaterial({
      vertexShader: atmosphereVertex,
      fragmentShader: atmosphereFragment,
      uniforms: {
        color1: { value: new THREE.Color('#3388ff') },
        color2: { value: new THREE.Color('#ff3388') },
        mixRatio: { value: 0.0 }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    })
  )

  atmosphere.scale.set(1.1, 1.1, 1.1)
  scene.add(atmosphere)

  //Added twice for thicker appearance

  atmosphere.scale.set(1.1, 1.1, 1.1)
  scene.add(atmosphere)

  const group = new THREE.Group()
  group.add(sphere)
  scene.add(group)

  // =========================================
  // Star Field Creation
  // =========================================
  function createStarField() {
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff
    })

    const starVertices = []
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000
      const y = (Math.random() - 0.5) * 2000
      const z = -Math.random() * 3000
      starVertices.push(x, y, z)
    }

    starGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starVertices, 3)
    )

    return new THREE.Points(starGeometry, starMaterial)
  }

  scene.add(createStarField())

  function createSecondStarField() {
    const starGeometry = new THREE.BufferGeometry()
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff
    })

    const starVertices = []
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * -2000
      const y = (Math.random() - 0.5) * -2000
      const z = -Math.random() * -3000
      starVertices.push(x, y, z)
    }

    starGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starVertices, 3)
    )

    return new THREE.Points(starGeometry, starMaterial)
  }

  scene.add(createSecondStarField())

  camera.position.z = 15

  // =========================================
  // Location Points Creation
  // =========================================
  function createPoint({ lat, lng, Title, Location, audio }) {
    // Create the main box
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.4, 1.0),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(MaterialStates.default.color),
        opacity: MaterialStates.default.opacity,
        transparent: true
      })
    )
    // Position calculation
    const latitude = (lat / 180) * Math.PI
    const longitude = (lng / 180) * Math.PI
    const radius = 5

    const x = radius * Math.cos(latitude) * Math.sin(longitude)
    const y = radius * Math.sin(latitude)
    const z = radius * Math.cos(latitude) * Math.cos(longitude)

    box.position.set(x, y, z)

    box.lookAt(0, 0, 0)
    box.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -0.4))

    // Pulsing animation
    gsap.to(box.scale, {
      z: 1.4,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'linear',
      delay: Math.random()
    })

    box.Title = Title
    box.Location = Location
    box.audio = audio

    group.add(box)
    return box
  }

  locations.forEach(createPoint)

  // =========================================
  // Interaction Setup
  // =========================================
  const mouse = {
    x: undefined,
    y: undefined,
    down: false,
    xPrev: undefined,
    yPrev: undefined
  }

  function enhanceLocationMarker(mesh, isHovered, isPlaying) {
    const targetState = isPlaying ? MaterialStates.active :
      isHovered ? MaterialStates.hover :
        MaterialStates.default

    gsap.to(mesh.material, {
      opacity: targetState.opacity,
      duration: 0.3
    })

    mesh.material.color.set(targetState.color)

    gsap.to(mesh.scale, {
      x: targetState.scale,
      y: targetState.scale,
      z: targetState.scale,
      duration: 0.3
    })
  }

  // Audio loading and playback
  async function loadAndPlaySong(marker) {
    return new Promise((resolve, reject) => {
      if (!marker.audio) {
        reject(new Error('No audio source provided'));
        return;
      }

      const handleSuccess = () => {
        AudioLoadingManager.hideLoading();
        // Initialize audio context on user interaction
        if (!audioContext) {
          updateSongDisplay(); // Hide initially
          audioContext = new AudioContext();
          audioSource = audioContext.createMediaElementSource(recordPlayer);
          analyser = audioContext.createAnalyser();
          audioSource.connect(analyser);
          analyser.connect(audioContext.destination);
        }

        recordPlayer.play()
          .then(() => {
            updateRotationSpeed(true);
            resolve();
          })
          .catch(reject);
        cleanup();
      };

      const handleError = () => {
        cleanup();
        reject(new Error('Failed to load audio'));
      };

      const cleanup = () => {
        recordPlayer.removeEventListener('canplay', handleSuccess);
        recordPlayer.removeEventListener('error', handleError);
      };

      recordPlayer.addEventListener('canplay', handleSuccess, { once: true });
      recordPlayer.addEventListener('error', handleError, { once: true });
      recordPlayer.addEventListener('ended', () => updateRotationSpeed(false));

      recordPlayer.src = marker.audio;
    });
  }

  // Controls setup
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.75; // Default speed
  controls.rotateSpeed = 0.5;
  controls.minPolarAngle = Math.PI * 0.2;
  controls.maxPolarAngle = Math.PI * 0.8;
  const raycaster = new THREE.Raycaster()


  // =========================================
  // Animation Loop
  // =========================================
  function animate() {
    requestAnimationFrame(animate);

    controls.update();

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      group.children.filter(mesh => mesh.geometry.type === 'BoxGeometry')
    );

    // Reset all markers
    group.children.forEach((mesh) => {
      if (mesh.geometry.type === 'BoxGeometry') {
        const isMeshPlaying = recordPlayer.src.includes(mesh.audio) && !recordPlayer.paused;
        enhanceLocationMarker(mesh, false, isMeshPlaying);

        // Adjust rotation speed based on playback
        if (isMeshPlaying) {
          controls.autoRotateSpeed = 1.2; // Slower rotation when playing
        } else if (!recordPlayer.src) {
          controls.autoRotateSpeed = 0.5; // Default speed when nothing is playing
        }
      }
    });

    // Handle intersected marker
    if (intersects.length > 0) {
      const marker = intersects[0].object;
      const isPlaying = recordPlayer.src.includes(marker.audio) && !recordPlayer.paused;
      enhanceLocationMarker(marker, true, isPlaying);
    }

    renderer.render(scene, camera);
  }

  function updateRotationSpeed(isPlaying) {
    controls.autoRotate = true; // Always keep rotating
    controls.autoRotateSpeed = isPlaying ? 0.3 : 0.5; // Adjust speed based on playback
  }
  // =========================================
  // Album Cover Interactions
  // =========================================

  // Function to generate album covers HTML
  function generateAlbumCovers() {
    const container = document.querySelector('.album-covers');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Generate album covers from locations data
    locations.forEach(location => {
      const albumCover = document.createElement('div');
      albumCover.className = 'album-cover';
      albumCover.dataset.location = location.Location.toLowerCase();

      // Create image element
      const img = document.createElement('img');
      img.src = location.img;
      img.alt = `${location.Title} Album Cover`;

      container.appendChild(albumCover);
      albumCover.appendChild(img);

      function handleAlbumCoverClick(event) {
        // Check auth state first
        if (!userAuthState.isLoggedIn) {
          const form = document.getElementById('myForm');
          if (backdrop && form) {
            backdrop.style.display = 'block';
            form.style.display = 'block';
          }
          return;
        }

        const albumCover = event.currentTarget;
        const location = albumCover.dataset.location;

        const marker = group.children.find(mesh =>
          mesh.geometry.type === 'BoxGeometry' &&
          mesh.Location.toLowerCase() === location.toLowerCase()
        );

        if (marker) {
          // Rest of your existing album click handler code...
          AudioLoadingManager.showLoading();
          songTitle.textContent = `Song: ${marker.Title}`;
          songLocation.textContent = `Location: ${marker.Location}`;
          popUpElement.style.display = "block";

          document.querySelectorAll('.album-cover').forEach(cover => {
            cover.classList.remove('playing');
          });

          albumCover.classList.add('playing');

          loadAndPlaySong(marker).catch(error => {
            console.error('Error loading audio:', error);
            AudioLoadingManager.hideLoading();
          });

          const markerPosition = new THREE.Vector3();
          marker.getWorldPosition(markerPosition);

          const distance = 12;
          const cameraTargetPosition = markerPosition.clone().normalize().multiplyScalar(distance);

          gsap.to(camera.position, {
            x: cameraTargetPosition.x,
            y: cameraTargetPosition.y,
            z: cameraTargetPosition.z,
            duration: 1.5,
            ease: "power2.inOut"
          });
        }
      }

      // Add click event listener
      albumCover.addEventListener('click', handleAlbumCoverClick);
    });
  }

  // Generate album covers and add click listeners
  generateAlbumCovers();

  // Update playing state of album covers when a marker is clicked
  function updateAlbumCoversState(marker) {
    document.querySelectorAll('.album-cover').forEach(cover => {
      const isPlaying = marker &&
        cover.dataset.location.toLowerCase() === marker.Location.toLowerCase();
      cover.classList.toggle('playing', isPlaying);
    });
  }
  // =========================================
  // Event Listeners
  // =========================================

  function handleInteraction(event) {
    // Prevent default behavior
    event.preventDefault();

    // First check authentication
    if (!userAuthState.isLoggedIn) {
      const form = document.getElementById('myForm');
      if (backdrop && form) {
        backdrop.style.display = 'block';
        form.style.display = 'block';
      }
      return; // Stop here if not logged in
    }

    // If logged in, proceed with normal interaction
    const x = event.clientX || (event.touches && event.touches[0].clientX);
    const y = event.clientY || (event.touches && event.touches[0].clientY);

    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
      group.children.filter(mesh => mesh.geometry.type === 'BoxGeometry')
    );

    if (intersects.length > 0) {
      const marker = intersects[0].object;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.2;

      AudioLoadingManager.showLoading();
      songTitle.textContent = `Song: ${marker.Title}`;
      songLocation.textContent = `Location: ${marker.Location}`;
      popUpElement.style.display = "block";

      updateAlbumCoversState(marker);

      loadAndPlaySong(marker).catch(error => {
        console.error('Error loading audio:', error);
        AudioLoadingManager.hideLoading();
      });
    }
  }

  canvas.addEventListener('click', handleInteraction, { passive: false });

  recordPlayer.addEventListener("play", () => {
    playSong();
    updateSongDisplay();
  });
  recordPlayer.addEventListener("pause", updateSongDisplay);
  recordPlayer.addEventListener("ended", updateSongDisplay);

  canvas.addEventListener('mousedown', ({ clientX, clientY }) => {
    mouse.down = true
    mouse.xPrev = clientX
    mouse.yPrev = clientY
  })

  addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    if (mouse.down) {
      event.preventDefault()
      const deltaX = event.clientX - mouse.xPrev
      const deltaY = event.clientY - mouse.yPrev

      group.rotation.offset = group.rotation.offset || { x: 0, y: 0 }
      group.rotation.offset.x += deltaY * 0.005
      group.rotation.offset.y += deltaX * 0.005

      gsap.to(group.rotation, {
        y: group.rotation.offset.y,
        x: group.rotation.offset.x,
        duration: 2
      })
      mouse.xPrev = event.clientX
      mouse.yPrev = event.clientY
    }
  })

  addEventListener('mouseup', () => {
    mouse.down = false
  })


  // Add after your existing form handling code


  function initializeForm() {
    // Get all DOM elements
    const submitButton = document.getElementById('submitButton')
    const buttonText = submitButton.querySelector('.button-text')
    const buttonLoader = submitButton.querySelector('.button-loader')
    const formMessage = document.getElementById('formMessage')
    const phoneInput = document.getElementById('phoneNumber')
    const acceptSubscription = document.getElementById('acceptSubscription')
    const declineSubscription = document.getElementById('declineSubscription')
    const subscriptionDialog = document.getElementById('subscriptionDialog')
    const form = document.getElementById('myForm')

    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx7tHnAV1TdhnDo-ci02Wd87WztdAn8UEmmcEK8r7r4KZXVascnYLy0M_TN7cF8zeEfug/exec'

    // Set initial button state
    submitButton.disabled = true
    submitButton.style.backgroundColor = "#555"
    submitButton.style.cursor = "not-allowed"

    // Phone number validation
    function isValidPhoneNumber(phone) {
        const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
        return phoneRegex.test(phone)
    }

    // Phone input handler with immediate validation
    phoneInput.addEventListener("input", () => {
        const digitsOnly = phoneInput.value.replace(/\D/g, '')
        if (digitsOnly.length === 10) {
            submitButton.disabled = false
            submitButton.style.backgroundColor = "#1a365d"
            submitButton.style.cursor = "pointer"
        } else {
            submitButton.disabled = true
            submitButton.style.backgroundColor = "#555"
            submitButton.style.cursor = "not-allowed"
        }
    })

    // Phone number submission and database check
    async function submitPhoneNumber(phoneNumber) {
      try {
          // Show loading state
          buttonText.classList.add('hidden')
          buttonLoader.classList.remove('hidden')
          formMessage.textContent = 'Checking phone number...'
          
          // Log login attempt to Google Sheets
          await fetch(SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  phoneNumber: phoneNumber,
                  timestamp: new Date().toISOString(),
                  action: 'login_attempt',
                  status: 'initiated'
              })
          })
          
          // Change the URL format to use query parameter
          console.log('Checking phone number:', phoneNumber)
          const checkResponse = await fetch(`${API_URL}/user/check?phoneNumber=${encodeURIComponent(phoneNumber)}`, {
              method: 'GET',
              headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
              }
          })
          
          console.log('Check response status:', checkResponse.status)
          
          if (!checkResponse.ok) {
              const errorText = await checkResponse.text()
              throw new Error(`Server responded with ${checkResponse.status}: ${errorText}`)
          }
          
          const checkResult = await checkResponse.json()
          console.log('Check result:', checkResult)
          
          // Show subscription dialog
          if (subscriptionDialog) {
              subscriptionDialog.classList.remove('dialog-hidden')
          } else {
              console.error('Subscription dialog element not found')
              throw new Error('Subscription dialog not found')
          }
          
      } catch (error) {
          console.error('Phone submission error:', error)
          formMessage.textContent = 'Error checking phone number. Please try again.'
          formMessage.style.color = '#f44336'
      } finally {
          buttonText.classList.remove('hidden')
          buttonLoader.classList.add('hidden')
      }
  }

    // Form submit handler
    submitButton.addEventListener('click', async (e) => {
        e.preventDefault()
        const phoneNumber = phoneInput.value.trim()

        if (!phoneNumber) {
            formMessage.textContent = 'Please enter your phone number'
            formMessage.style.color = '#f44336'
            return
        }

        if (!isValidPhoneNumber(phoneNumber)) {
            formMessage.textContent = 'Please enter a valid phone number'
            formMessage.style.color = '#f44336'
            return
        }

        await submitPhoneNumber(phoneNumber)
    })

    // Handle subscription acceptance
    acceptSubscription.addEventListener('click', async () => {
        const phoneNumber = phoneInput.value.trim()
        try {
            console.log('Accepting subscription for:', phoneNumber)
            // Step 3: Save user to database with subscription
            const response = await fetch(`${API_URL}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    phoneNumber,
                    subscribeToTexts: true
                })
            })
            
            console.log('Subscription response status:', response.status)
            
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Signup failed: ${errorText}`)
            }
            
            const userData = await response.json()
            console.log('User data:', userData)
            
            // Log to Google Sheets
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: phoneNumber,
                    timestamp: new Date().toISOString(),
                    action: 'new_signup',
                    subscribed: true
                })
            })
            
            // Update UI state
            updateLoginState(true, phoneNumber)
            closeForm()
            
        } catch (error) {
            console.error('Subscription error:', error)
            formMessage.textContent = 'Failed to save subscription. Please try again.'
            formMessage.style.color = '#f44336'
        }
    })

    // Handle subscription decline
    declineSubscription.addEventListener('click', async () => {
        const phoneNumber = phoneInput.value.trim()
        try {
            console.log('Declining subscription for:', phoneNumber)
            // Allow access without saving to database
            updateLoginState(true, phoneNumber)
            localStorage.setItem('formSubmitted', 'true')
            closeForm()
            
        } catch (error) {
            console.error('Decline handling error:', error)
            formMessage.textContent = 'Error processing request. Please try again.'
            formMessage.style.color = '#f44336'
        }
    })

    // Check if form was already submitted
    if (localStorage.getItem('formSubmitted') === 'true') {
        form.style.display = 'none'
        if (backdrop) backdrop.style.display = 'none'
    }
}


  // Function to close the form
  function closeForm() {
    const form = document.getElementById('myForm')
    const backdrop = document.querySelector('.backdrop')
    const subscriptionDialog = document.getElementById('subscriptionDialog')
    
    if (form) form.style.display = 'none'
    if (backdrop) backdrop.style.display = 'none'
    if (subscriptionDialog) subscriptionDialog.classList.add('dialog-hidden')
}



  // Add click event listener to backdrop to close form when clicking outside
  backdrop.addEventListener('click', (e) => {
    // Check if the click is on the backdrop itself (not on the form)
    if (e.target === backdrop) {
      closeForm();
    }
  })

  // Handle window resize
  addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)

    if (visualizerCanvas) {
      visualizerCanvas.width = window.innerWidth
      visualizerCanvas.height = window.innerHeight
    }
  })

  async function handlePhoneSubmission(phoneNumber) {
    try {
      const response = await fetch(`${API_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber })
      });
      // Rest of the code...
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  // Start the application
  animate()
  updateUIBasedOnAuth();
  initializeForm()
  initializeUI(); // Add this line
}