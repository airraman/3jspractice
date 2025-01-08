// =========================================
// Imports and Initial Setup
// =========================================
import * as THREE from 'three'
import './style.css'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import atmosphereVertex from './shaders/atmosphereVertex.glsl'
import atmosphereFragment from './shaders/atmosphereFragment.glsl'
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
    audio: musicLibary.paris
  },
  {
    lat: 51.5074,   // London
    lng: -0.1278,
    Title: "memory lane",
    Location: "london",
    audio: musicLibary.london
  },
  {
    lat: 38.7223,   // Lisbon
    lng: -9.1393,
    Title: "summer in lisbon",
    Location: "lisbon",
    audio: musicLibary.lisbon
  },
  {
    lat: 40.6782,   // Brooklyn
    lng: -73.9442,
    Title: "bushwick yacht club",
    Location: "bushwick",
    audio: musicLibary.brooklyn
  },
  {
    lat: 37.8044,   // Oakland
    lng: -122.2712,
    Title: "somewhere out in oakland",
    Location: "LA",
    audio: musicLibary.oakland
  },
  {
    lat: -33.8688,  // Sydney
    lng: 151.2093,
    Title: "skyclub",
    Location: "sydney",
    audio: musicLibary.sydney
  }
]

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp)

function initializeApp() {


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

  // Audio visualization canvas
  const visualizerCanvas = document.getElementById('canvas')
  if (visualizerCanvas) {
    visualizerCanvas.width = window.innerWidth
    visualizerCanvas.height = window.innerHeight
  }

function playSong() {
    // If we already have an audio context, reuse it
    if (!audioContext) {
        audioContext = new AudioContext()
        audioSource = audioContext.createMediaElementSource(recordPlayer)
        analyser = audioContext.createAnalyser()
        
        audioSource.connect(analyser)
        analyser.connect(audioContext.destination)
    }
    
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
        const r = barHeight + (0 * (i/bufferLength))
        const g = 120 * (i/bufferLength)
        const b = 86
        
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight)
        x += barWidth + .001
    }
    }
    
    renderFrame()
}

recordPlayer.addEventListener("play", playSong)

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
)

// Initial sphere rotation
  sphere.rotation.y = -Math.PI / 2

// Atmosphere effect
// In your globe creation section:
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
function createPoint({lat, lng, Title, Location, audio}) {
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
controls.autoRotateSpeed = 0.5; // Default speed
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
              controls.autoRotateSpeed = 0.2; // Slower rotation when playing
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
  // Event Listeners
  // =========================================

function handleInteraction(event) {
    // Prevent default behavior
    event.preventDefault();

    // Get the position for both touch and click events
    const x = event.clientX || (event.touches && event.touches[0].clientX);
    const y = event.clientY || (event.touches && event.touches[0].clientY);

    // Convert to normalized device coordinates
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
        group.children.filter(mesh => mesh.geometry.type === 'BoxGeometry')
    );

    if (intersects.length > 0) {
        const marker = intersects[0].object;
        // Force autoRotate to true but at a slower speed
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.2; // Reduced speed when playing

        // Update display and play song
        AudioLoadingManager.showLoading();
        songLocation.innerHTML = marker.Location;
        songTitle.innerHTML = marker.Title;
        
        loadAndPlaySong(marker).catch(error => {
            console.error('Error loading audio:', error);
            AudioLoadingManager.hideLoading();
        });
    }
}

canvas.addEventListener('click', handleInteraction, { passive: false });
canvas.addEventListener('touchstart', handleInteraction, { passive: false });

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

// Handle form submit button




// Add after your existing form handling code


function initializeForm() {
  // Get all DOM elements
  const form = document.getElementById('myForm')
  const submitButton = document.getElementById('submitButton')
  const buttonText = submitButton.querySelector('.button-text')
  const buttonLoader = submitButton.querySelector('.button-loader')
  const formMessage = document.getElementById('formMessage')
  const phoneInput = document.getElementById('phoneNumber')
  const backdrop = document.querySelector('.backdrop')
  const subscriptionDialog = document.getElementById('subscriptionDialog')
  const acceptSubscription = document.getElementById('acceptSubscription')
  const declineSubscription = document.getElementById('declineSubscription')

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

  // Phone input handler
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

  // Phone number submission
  async function submitPhoneNumber(phoneNumber) {
      try {
          buttonText.classList.add('hidden')
          buttonLoader.classList.remove('hidden')
          
          const formData = {
              phoneNumber: phoneNumber,
              timestamp: new Date().toISOString()
          }
          
          const response = await fetch(SCRIPT_URL, {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(formData)
          })

          formMessage.textContent = 'Thank you!'
          formMessage.style.color = '#4CAF50'
          
          // Show subscription dialog
          subscriptionDialog.classList.remove('dialog-hidden')
          
      } catch (error) {
          console.error('Submission error:', error)
          formMessage.textContent = 'Something went wrong. Please try again.'
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

  // Subscription dialog handlers
  acceptSubscription.addEventListener('click', () => {
      localStorage.setItem('subscribed', 'true')
      localStorage.setItem('formSubmitted', 'true')
      subscriptionDialog.classList.add('dialog-hidden')
      form.style.display = 'none'
      if (backdrop) backdrop.style.display = 'none'
  })
  
  declineSubscription.addEventListener('click', () => {
      localStorage.setItem('formSubmitted', 'true')
      subscriptionDialog.classList.add('dialog-hidden')
      form.style.display = 'none'
      if (backdrop) backdrop.style.display = 'none'
  })

  // Check if form was already submitted
  if (localStorage.getItem('formSubmitted') === 'true') {
      form.style.display = 'none'
      if (backdrop) backdrop.style.display = 'none'
  }
}

// Call initializeForm after DOM is loaded
// document.addEventListener('DOMContentLoaded', () => {
//   initializeForm()
// })

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

  // Start the application
  animate()
  initializeForm()
}