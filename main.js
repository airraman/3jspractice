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


// Create Shape
// const geometry = new THREE.SphereGeometry(3, 64, 64)
// const material = new THREE.MeshStandardMaterial({
//   color: "#00ff83",
//   roughness: .02
// })
// const mesh = new THREE.Mesh(geometry, material)

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

 const starGeometry = new THREE.BufferGeometry()

 const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff
 })

 const starVertices = []


 for (let i =0; i < 10000; i++){
  const x = (Math.random() - .5) * 2000
  const y = (Math.random() - .5) * 2000
  const z = Math.random() * 2000
  starVertices.push(x,y,z)
 }

 starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3))


 console.log(starVertices)

 const stars = new THREE.Points(starGeometry, starMaterial)

 scene.add(stars)

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