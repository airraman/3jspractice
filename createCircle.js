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