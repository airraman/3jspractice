import * as THREE from 'three'
import './style.css'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import atmosphereVertex from './shaders/atmosphereVertex.glsl'
import atmosphereFragment from './shaders/atmosphereFragment.glsl'
import atmosphereFragmentTwo from './shaders/atmosphereFragmentTwo.glsl'
import atmosphereFragmentThree from './shaders/atmosphereFragmentThree.glsl'
import atmosphereFragmentFour from './shaders/atmosphereFragmentFour.glsl'
// const module2 = import('./shaders/atmosphereFragmentTwo.glsl')
import AudioMotionAnalyzer from 'audiomotion-analyzer';


const login = document.getElementById("submitButton")
const popUpForm = document.getElementById("myForm")

login.addEventListener("click", (event)=> {
  console.log(event)
  popUpForm.style.display = "none"
})

const musicLibary = {
  paris: "/paris.mp3", 
  sydney: "/skyclub.mp3", 
  brooklyn: "/yachtclub.mp3", 
  london: "/memorylane.mp3", 
  lisbon: "/lisbon.mp3", 
  oakland: "/oakland.mp3"
}


let currentFragment = atmosphereFragmentFour

function colorChanger(currentFragment){

  currentFragment = atmosphereFragmentTwo

  console.log("here I am")

  return function () {
    if (!hasBeenCalled) {
        console.log('Function called!');
        hasBeenCalled = true;
    } else {
        console.log('Function can only be called once.');
    }
};

   

  //  setTimeout(()=>{
  //   currentFragment = atmosphereFragmentThree
  //  }, 1)

  //  console.log(currentFragment)

}


//Initiate Typewriter 
var typingElement = document.querySelector(".innertext");
var typeArray = ["Welcome to SongMap.io", 
  "These are songs I wrote all around the world", 
  "Click on a location", 
  "and listen to the song"];
var index = 0,
  isAdding = true,
  typeIndex = 0;

function playAnim() {
  setTimeout(
    function () {
      typingElement.innerText = typeArray[typeIndex].slice(0, index);
      if (isAdding) {
        if (index >= typeArray[typeIndex].length) {
          isAdding = false;
          setTimeout(function () {
            playAnim();
          }, 2000);
          return;
        } else {
          index++;
        }
      } else {
        if (index === 0) {
          isAdding = true;
          typeIndex++;
          if (typeIndex >= typeArray.length) {
            typeIndex = 0;
          }
        } else {
          index--;
        }
      }
      playAnim();
    },
    isAdding ? 120 : 60
  );
}
playAnim();

//Begin Record Visualizer

const recordPlayer = document.getElementById('song')
const container = document.getElementById('canvas');
const songSelector = document.getElementsByClassName('circle')

// const audioContext = new AudioContext();



function playSong () {

  // colorChanger()
  console.log(recordPlayer.src)

  var context = new AudioContext();
  var src = context.createMediaElementSource(recordPlayer);
  var analyser = context.createAnalyser();
  
  var ctx = container.getContext("2d");
  
  src.connect(analyser);
  analyser.connect(context.destination);
  
  analyser.fftSize = 256;
  
  var bufferLength = analyser.frequencyBinCount;
  // console.log(bufferLength);
  
  var dataArray = new Uint8Array(bufferLength);
  
  var WIDTH = container.width;
  var HEIGHT = container.height * 1 ;
  
  var barWidth = (WIDTH / bufferLength) * 1;
  var barHeight;
  var x = 0;
  
  function renderFrame() {
    requestAnimationFrame(renderFrame);
  
    x = 0;
  
    analyser.getByteFrequencyData(dataArray);
  
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
    for (var i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];
      
      var r = barHeight + (0 * (i/bufferLength));
      var g = 120 * (i/bufferLength);
      var b = 86;
  
      ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
  
      x += barWidth + .001;
    }
  }
  renderFrame();
};

recordPlayer.addEventListener("play", playSong)



//End Record Visualizer

const canvas = document.querySelector('.webgl');

//Sizes 
const sizes = {
  width: window.innerWidth, 
  height: window.innerHeight
}

//Create Scene
const scene = new THREE.Scene();

//Camera

const camera = new THREE.PerspectiveCamera(45, sizes.width/sizes.height)

//Moving camera back since default is to be in same position as shape
camera.position.z = 15
scene.add(camera)

//Renderer

const renderer = new THREE.WebGLRenderer({canvas, 
  antialias: true});
renderer.setPixelRatio(window.devicePixelRatio)

renderer.setSize(sizes.width, sizes.height)
renderer.render(scene, camera)

//creating sphere object

const sphere = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 20), new THREE.ShaderMaterial({  
  vertexShader,
  fragmentShader, 
  uniforms: {
   globeTexture: {
     value: new THREE.TextureLoader().load('/img/globe.jpeg')
   }
  }
 }))

 scene.add(sphere)

//creating atmosphere object

const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(2.5, 20, 20), new THREE.ShaderMaterial({  
  vertexShader: atmosphereVertex,
  fragmentShader: currentFragment, 
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide
 }))

 atmosphere.scale.set(1.1,1.1,1.1)
 
 scene.add(atmosphere)

 const group = new THREE.Group()
 group.add(sphere)
 scene.add(group)


 //creates stars on one half of the screen 
 const starGeometry = new THREE.BufferGeometry()

 const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff
 })

const starVertices = []
for (let i = 0; i < 20000; i++) {
  const x = (Math.random() - 0.5) * 2000
  const y = (Math.random() - 0.5) * 2000
  const z = -Math.random() * 3000
  starVertices.push(x, y, z)
}

starGeometry.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starVertices, 3)
)

const stars = new THREE.Points(starGeometry, starMaterial)
scene.add(stars)

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))

console.log(starVertices)
//creates stars on one half of the screen

//populating stars on other side of screen
const starGeometryTwo = new THREE.BufferGeometry()

const starMaterialTwo = new THREE.PointsMaterial({
  color: 0xffffff
 })

const starVerticesTwo = []
 for (let i = 0; i < 20000; i++) {
   const x = (Math.random() - 0.5) * -2000
   const y = (Math.random() - 0.5) * -2000
   const z = -Math.random() * -3000
   starVerticesTwo.push(x, y, z)
 }

starGeometryTwo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))

const starsTwo = new THREE.Points(starGeometryTwo, starMaterialTwo)
scene.add(starsTwo)

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVerticesTwo, 3))
//populating stars on other side of screen

//Light 
const light = new THREE.PointLight(0xffffff, 100, 0)
light.position.set(0, 10, 10)
scene.add(light)

function createPoint({lat, lng, Title, Location, audio}){

  const box = new THREE.Mesh(
  new THREE.BoxGeometry(.25, .25, .25), 
  new THREE.MeshBasicMaterial({
  color:'#BCD2F1', 
  opacity: .4, 
  transparent: true
  })
  )
  const latitude = (lat / 180) * Math.PI
  const longitude = (lng/ 180) * Math.PI
  const radius = 1.5

  const x = radius * Math.cos(latitude) * Math.sin(longitude)
  const y = radius * Math.sin(latitude)
  const z = radius * Math.cos(latitude) * Math.cos(longitude)

  box.position.x = x 
  box.position.y = y  
  box.position.z = z 

  box.lookAt(0,0,0)

  gsap.to(box.scale, {
    z: 1.5, 
    duration: 5, 
    yoyo: true,
    repeat: -1,  
    ease: 'linear', 
    delay: Math.random()
  })
  box.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -.4))

  box.Title = Title
  box.Location = Location
  box.audio = audio


  group.add(box)

}


sphere.rotation.y = -Math.PI/6

group.rotation.offset = {
  x: 0,
  y: 0
}

// let paris = [50.3575, 60.614]

//PARIS
createPoint({lat: 50.3575, lng: 60.614, Title: "6am in Paris", Location: "paris", audio: musicLibary.paris })

// //AMSTERDAM
// createPoint(56.3676, 66.9041)

//LONDON
createPoint({lat: 56.5072, lng: 60.1276, Title: "memory lane", Location: "london", audio: musicLibary.london})

// //CASABLANCA
// createPoint(30.6225, 55.9898)

//LISBON
createPoint({lat: 40.7223, lng: 50.1393, Title: "summer in lisbon", Location: "lisbon", audio: musicLibary.lisbon})

//BROOKLYN
createPoint({lat: 38.6958, lng: -18.9171, Title: 'bushwick yacht club', Location: "bushwick", audio: musicLibary.brooklyn})

//LOS ANGELES
createPoint({lat: 37.8044, lng: -58.2712, Title: "somewhere out in oakland", Location: "LA", audio: musicLibary.oakland})

// //BENIN
// createPoint({lat: 6.3562, lng: 55.4278, Title: "sleeptalking", Location: "west africa", audio: musicLibary.w})

//SYDNEY
createPoint({lat: -33.8688, lng: 208.2093, Title: "skyclub", Location: "sydney", audio: musicLibary.sydney})

const mouse = {
  x: 0,
  y: 0,
}

//Controls 

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true 
controls.enablePan = false
controls.enableZoom = false
controls.autoRotate = true
controls.autoRotateSpeed = 2.2

addEventListener("mousemove", (event) => {
  console.log(event)
  controls.autoRotate = true
});


const raycaster = new THREE.Raycaster();
const popUpEl = document.querySelector('#popUpElement')
const songTitle = document.querySelector('#songTitle')
const songLocation = document.querySelector('#songLocation')


function animate(){
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
  // sphere.rotation.y += 0.003
  group.rotation.y = 0.003
  controls.autoRotate = true

  if(mouse.x){
    gsap.to(group.rotation, {
      x: -mouse.y * 1.8,
      y: mouse.x *1.8,
      duration: 2
    })
  }

	raycaster.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects(group.children.filter(mesh =>{
    return mesh.geometry.type === 'BoxGeometry'
  }) );

  group.children.forEach((mesh) => {
    mesh.material.opacity = .8
    // console.log(mesh)
  } )

  gsap.set(popUpEl, {
    // display: 'none'
  })

	for ( let i = 0; i < intersects.length; i ++ ) {
    const box = intersects[ i ].object
    box.material.opacity = 1
    gsap.set(popUpEl, {
      display: 'block'
    })

    //This function needs to be called one time, and then cancelled out so that it stops firing continuously 

    controls.autoRotate = false
    
    if(songLocation.innerHTML != box.Location){
      songLocation.innerHTML = box.Location
      songTitle.innerHTML = box.Title
      song.src = box.audio
    }
    
    recordPlayer.play()
    return     
	}

	renderer.render( scene, camera );

}
animate()

//explore on click

canvas.addEventListener('mousemove',(event) =>{
  mouse.x = ((event.clientX - innerWidth ))/(innerWidth) +.5
  mouse.y = -(event.clientY/innerHeight) +.5
  console.log(mouse.x, mouse.y)
})

//Resize 
window.addEventListener('resize', ()=>{
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()
  renderer.setSize(sizes.width, sizes.height)
})

const loop = () => {
  controls.update()
  renderer.render(scene, camera)
  window.requestAnimationFrame(loop)
}

loop()




