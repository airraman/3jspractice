import * as THREE from 'three'
import './style.css'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import atmosphereVertex from './shaders/atmosphereVertex.glsl'
import atmosphereFragment from './shaders/atmosphereFragment.glsl'

//Create Scene
const scene = new THREE.Scene();

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


//Sizes 
const sizes = {
  width: window.innerWidth, 
  height: window.innerHeight
}

//Light 
const light = new THREE.PointLight(0xffffff, 100, 0)
light.position.set(0, 10, 10)
scene.add(light)

//Camera

const camera = new THREE.PerspectiveCamera(45, sizes.width/sizes.height)

//Moving camera back since default is to be in same position as shape
camera.position.z = 15
scene.add(camera)

function createPoint(lat, lng){

  const box = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, .8), 
new THREE.MeshBasicMaterial({
  color:'#BCD2F1'
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

  sphere.rotation.y = -Math.PI/2

  box.lookAt(0,0,0)

  gsap.to(box.scale, {
    z: 0, 
    duration: 5, 
    yoyo: true,
    repeat: -1, 
    delay: Math.random()
  })
  box.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, -.4))

  scene.add(box)
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



//48.8575° N, 2.3514° E = paris



//Renderer

const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({canvas, 
  antialias: true});
renderer.setPixelRatio(window.devicePixelRatio)

renderer.setSize(sizes.width, sizes.height)
renderer.render(scene, camera)


//Controls 

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true 
controls.enablePan = false
controls.enableZoom = false
controls.autoRotate = true
controls.autoRotateSpeed = 5

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

//timeline management

const tl = gsap.timeline({default: {duration: 1}})
tl.fromTo(Mesh.scale, {x:0, y:0, z:0}, {x:1, y:1, z:1})
tl.fromTo('nav', {y: "-100%"}, {y: "0%"})
tl.fromTo('.title', {opacity: 0}, {opacity: 1})

//Mouse Anmiation Color

// let mouseDown = false
// let rgb = [12, 23, 55]


// window.addEventListener('mousedown', () =>(mouseDown = true))
// window.addEventListener('mouseup', () =>(mouseDown = false))

// window.addEventListener('mousemove', (e) =>{
//   if(mouseDown){
//     rgb = [
//       Math.round((e.pageX / sizes.width) * 255), 
//       Math.round((e.pageY / sizes.height) * 255),
//       150
//     ]
//     let newColor = new THREE.Color(`rgb(${rgb.join(",")})`)
//     new THREE.Color((`rgb(0, 100, 150)`))
//     gsap.to(mesh.material.color, {r: newColor.r, g: newColor.g, b:newColor.b})
//   }
// })

