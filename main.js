import * as THREE from 'three'
import './style.css'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/Addons.js';


//Create Scene
const scene = new THREE.Scene();

//Create Shape
// const geometry = new THREE.SphereGeometry(3, 64, 64)
// const material = new THREE.MeshStandardMaterial({
//   color: "#00ff83",
//   roughness: .02
// })
// const mesh = new THREE.Mesh(geometry, material)
const sphere = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 20), new THREE.MeshBasicMaterial({
  // color: 0xFF0000, 
  map: new THREE.TextureLoader().load('./img/globe.jpeg')

}))
scene.add(sphere)


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
const renderer = new THREE.WebGLRenderer({canvas});
renderer.setPixelRatio(2)

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
tl.fromTo(mesh.scale, {x:0, y:0, z:0}, {x:1, y:1, z:1})
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