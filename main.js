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
  const popUpEl = document.querySelector('#popUpElement')
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
    1000
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
        reject(new Error('No audio source provided'))
        return
      }

      const handleSuccess = () => {
        AudioLoadingManager.hideLoading()
        recordPlayer.play()
          .then(resolve)
          .catch(reject)
        cleanup()
      }

      const handleError = () => {
        cleanup()
        reject(new Error('Failed to load audio'))
      }

      const cleanup = () => {
        recordPlayer.removeEventListener('canplay', handleSuccess)
        recordPlayer.removeEventListener('error', handleError)
      }

      recordPlayer.addEventListener('canplay', handleSuccess, { once: true })
      recordPlayer.addEventListener('error', handleError, { once: true })
      
      recordPlayer.src = marker.audio
    })
  }

  // Controls setup
  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.enablePan = false
  controls.enableZoom = false
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.5
  controls.rotateSpeed = 0.5
  controls.minPolarAngle = Math.PI * 0.2
  controls.maxPolarAngle = Math.PI * 0.8

  const raycaster = new THREE.Raycaster()


// =========================================
// Animation Loop
// =========================================
function animate() {
  requestAnimationFrame(animate)
  
  controls.update()

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(
      group.children.filter(mesh => mesh.geometry.type === 'BoxGeometry')
  )

  // Reset all markers
  group.children.forEach((mesh) => {
      if (mesh.geometry.type === 'BoxGeometry') {
          const isMeshPlaying = recordPlayer.src.includes(mesh.audio) && !recordPlayer.paused
          enhanceLocationMarker(mesh, false, isMeshPlaying)
      }
  })

  // Handle intersected marker
  if (intersects.length > 0) {
      const marker = intersects[0].object
      controls.autoRotate = false
  } else {
      controls.autoRotate = true
  }

  renderer.render(scene, camera)
}

  // =========================================
  // Event Listeners
  // =========================================
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
  const submitButton = document.getElementById('submitButton')
  const popUpForm = document.getElementById('myForm')
  if (submitButton && popUpForm) {
    submitButton.addEventListener('click', () => {
      popUpForm.style.display = 'none'
    })
  }

  canvas.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(
        group.children.filter(mesh => mesh.geometry.type === 'BoxGeometry')
    )

    if (intersects.length > 0) {
        const marker = intersects[0].object
        if (marker.Location && songLocation.innerHTML !== marker.Location) {
            AudioLoadingManager.showLoading()
            songLocation.innerHTML = marker.Location
            songTitle.innerHTML = marker.Title
            
            loadAndPlaySong(marker).catch(error => {
                console.error('Error loading audio:', error)
                AudioLoadingManager.hideLoading()
            })
        }
    }
})

  // Add after your existing form handling code


  function initializeForm() {
    const form = document.getElementById('myForm')
    const submitButton = document.getElementById('submitButton')
    const buttonText = submitButton.querySelector('.button-text')
    const buttonLoader = submitButton.querySelector('.button-loader')
    const formMessage = document.getElementById('formMessage')
    const phoneInput = document.getElementById('phoneNumber')
    const backdrop = document.querySelector('.backdrop')
    
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx7tHnAV1TdhnDo-ci02Wd87WztdAn8UEmmcEK8r7r4KZXVascnYLy0M_TN7cF8zeEfug/exec'
    
    // Phone number validation
    function isValidPhoneNumber(phone) {
      const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
      return phoneRegex.test(phone)
    }
    
    async function submitPhoneNumber(phoneNumber) {
      console.log('Attempting to submit phone number:', phoneNumber) // Debug log
      
      try {
        buttonText.classList.add('hidden')
        buttonLoader.classList.remove('hidden')
        
        // Format the data
        const formData = {
          phoneNumber: phoneNumber,
          timestamp: new Date().toISOString()
        }
        
        console.log('Sending data:', formData) // Debug log
        
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors', // Important for Google Apps Script
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        })
        
        console.log('Response received:', response) // Debug log
        
        // Since mode is no-cors, we can't read the response
        // Instead, we'll assume success if the request didn't throw an error
        formMessage.textContent = 'Thank you for subscribing!'
        formMessage.style.color = '#4CAF50'
        
        // Store in localStorage to prevent showing form again
        localStorage.setItem('formSubmitted', 'true')
        
        setTimeout(() => {
          form.style.display = 'none'
          if (backdrop) backdrop.style.display = 'none'
        }, 2000)
        
      } catch (error) {
        console.error('Submission error:', error) // Debug log
        formMessage.textContent = 'Something went wrong. Please try again.'
        formMessage.style.color = '#f44336'
      } finally {
        buttonText.classList.remove('hidden')
        buttonLoader.classList.add('hidden')
      }
    }
    
    // Form submission handler
    submitButton.addEventListener('click', async (e) => {
      e.preventDefault()
      
      const phoneNumber = phoneInput.value.trim()
      console.log('Submit clicked, phone number:', phoneNumber) // Debug log
      
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
    
    // Check if form was already submitted
    if (localStorage.getItem('formSubmitted') === 'true') {
      form.style.display = 'none'
      if (backdrop) backdrop.style.display = 'none'
    }
  }
  
  // Call initializeForm after DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    initializeForm()
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

  // Start the application
  animate()
}