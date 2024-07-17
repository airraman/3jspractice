import * as THREE from 'three'
import './style.css'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import atmosphereVertex from './shaders/atmosphereVertex.glsl'
import atmosphereFragment from './shaders/atmosphereFragment.glsl'
import AudioMotionAnalyzer from 'audiomotion-analyzer';



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

// const audioContext = new AudioContext();



function playSong () {


  console.log(recordPlayer.src)

  var context = new AudioContext();
  var src = context.createMediaElementSource(recordPlayer);
  var analyser = context.createAnalyser();
  
  var ctx = container.getContext("2d");
  
  src.connect(analyser);
  analyser.connect(context.destination);
  
  analyser.fftSize = 256;
  
  var bufferLength = analyser.frequencyBinCount;
  console.log(bufferLength);
  
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

const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 20), new THREE.ShaderMaterial({  
  vertexShader: atmosphereVertex,
  fragmentShader: atmosphereFragment, 
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

//population other side of screen
const starGeometryTwo = new THREE.BufferGeometry()

const starMaterialTwo = new THREE.PointsMaterial({
  color: 0xffffff
 })

const starVerticesTwo = []
 for (let i = 0; i < 20000; i++) {
   const x = (Math.random() - 0.5) * -2000
   const y = (Math.random() - 0.5) * -2000
   const z = -Math.random() * -3000
   starVertices.push(x, y, z)
 }

 starGeometryTwo.setAttribute(
  'position',
  new THREE.Float32BufferAttribute(starVertices, 3)
)

const starsTwo = new THREE.Points(starGeometryTwo, starMaterialTwo)
scene.add(starsTwo)

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVerticesTwo, 3))
//population other side of screen

//Light 
const light = new THREE.PointLight(0xffffff, 100, 0)
light.position.set(0, 10, 10)
scene.add(light)

function createPoint(lat, lng){

  const box = new THREE.Mesh(
  new THREE.BoxGeometry(.1, .1, .8), 
  new THREE.MeshBasicMaterial({
  color:'#BCD2F1', 
  opacity: .4, 
  transparent: true
  })
  )
  const latitude = (lat / 180) * Math.PI
  const longitude = (lng/ 180) * Math.PI
  const radius = 2

  const x = radius * Math.cos(latitude) * Math.sin(longitude)
  const y = radius * Math.sin(latitude)
  const z = radius * Math.cos(latitude) * Math.cos(longitude)

  box.position.x = x
  box.position.y = y
  box.position.z = z 

  box.lookAt(0,0,0)

  gsap.to(box.scale, {
    z: 1.4, 
    duration: 5, 
    yoyo: true,
    repeat: -1,  
    ease: 'linear', 
    delay: Math.random()
  })
  box.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -.4))

  group.add(box)

}

// function createPoint(lat, lng){

//   const circle = new THREE.Mesh(
//   new THREE.CircleGeometry( .2, 16, 5 ), 
//   new THREE.MeshBasicMaterial({
//     color: 0xffff00
//   })
//   )
//   const latitude = (lat / 180) * Math.PI
//   const longitude = (lng/ 180) * Math.PI
//   const radius = 2

//   const x = radius * Math.cos(latitude) * Math.sin(longitude)
//   const y = radius * Math.sin(latitude)
//   const z = radius * Math.cos(latitude) * Math.cos(longitude)

//   circle.position.x = x
//   circle.position.y = y
//   circle.position.z = z 

//   circle.lookAt(0,0,0)

//   gsap.to(circle.scale, {
//     z: .1, 
//     // duration: 5, 
//     // yoyo: true,
//     // repeat: -1,  
//     // ease: 'linear', 
//     delay: Math.random()
//   })
//   circle.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -.4))

//   scene.add(circle)

// }

sphere.rotation.y = -Math.PI/6

group.rotation.offset = {
  x: 0,
  y: 0
}

createPoint(48.8575, 2.3514)
createPoint(52.3676, 4.9041)
createPoint(51.5072, -0.1276)
createPoint(31.6225, -7.9898)
createPoint(38.7223, -9.1393)
createPoint(40.6958, -73.9171)
createPoint(37.8044, -122.2712)
createPoint(6.3562, 2.4278)
createPoint(-33.8688, 151.2093)

const mouse = {
  x: 0,
  y: 0,
}

const raycaster = new THREE.Raycaster();
console.log(raycaster)
console.log(scene.children)
console.log(group.children.filter((mesh)=>{
  return mesh.geometry.type === 'BoxGeometry'
}))

// Left off here, stopped tutoral around 16M of box data

function animate(){
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
  // sphere.rotation.y += 0.003
  group.rotation.y = 0.003

  if(mouse.x){
    gsap.to(group.rotation, {
      x: -mouse.y * 1.8,
      y: mouse.x *1.8,
      duration: 2
    })
  }

  // update the picking ray with the camera and pointer position
	raycaster.setFromCamera( mouse, camera );

	// calculate objects intersecting the picking ray
	const intersects = raycaster.intersectObjects(group.children.filter(mesh =>{
    return mesh.geometry.type === 'BoxGeometry'
  }) );

	for ( let i = 0; i < intersects.length; i ++ ) {
    console.log("go")

		// intersects[ i ].object.material.color.set( 0xff0000 );

	}

	renderer.render( scene, camera );

}
animate()

canvas.addEventListener('mousemove',(event) =>{
  mouse.x = ((event.clientX - innerWidth ))/(innerWidth) +.5
  mouse.y = -(event.clientY/innerHeight) +.5
  console.log(mouse.x, mouse.y)
})

//Controls 

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true 
controls.enablePan = false
controls.enableZoom = false
controls.autoRotate = true
// controls.autoRotateSpeed = 5

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




