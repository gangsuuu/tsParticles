import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
window.addEventListener('load', function () {
  init()
})

async function init() {
  const renderer = new THREE.WebGLRenderer({
      antialias:true,
  });
  
  /** outputencdoing */
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;

  renderer.setSize(window.innerWidth,window.innerHeight)

  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    500
  )

  camera.position.set(0, 5, 20)

  /** LodingManager */
  const loadingmanager = new THREE.LoadingManager();

  const progressBar = document.querySelector('#progress-bar') 
  const progressBarContainer = document.querySelector('#progress-bar-container') 

  loadingmanager.onProgress = (url, loaded, total) => {
    progressBar.value = (loaded / total) * 100
  }

  loadingmanager.onLoad = () => {
    progressBarContainer.style.display = 'none'  
  }

  const gltfLoader = new GLTFLoader(loadingmanager);
 


  /** charater */
  const gltf = await gltfLoader.loadAsync('models/charater.gltf')

  const model = gltf.scene;

  model.scale.set( .1, .1, .1)
  model.traverse( object => {
    if(object.isMesh){
      object.castShadow = true
    }
  })

  scene.add(model)
  camera.lookAt(model.position)


  /** Plan */
  const planGeometry = new THREE.PlaneGeometry(10000, 10000, 10000);
  const planMaterial = new THREE.MeshPhongMaterial({
    color : 0x000000
  })

  const planMash = new THREE.Mesh(planGeometry, planMaterial)

  planMash.rotation.x = -Math.PI / 2;
  planMash.position.y = -7.5
  planMash.receiveShadow = true
  scene.add(planMash)

  /** spotLight */
  const  spotLight = new THREE.SpotLight(0xffffff, 1.5, 30, Math.PI * 0.15, 0.5, 0.5)
  
  spotLight.position.set(0, 20, 0)
  spotLight.castShadow =true
  spotLight.shadow.mapSize.width = 1024
  spotLight.shadow.mapSize.Height = 1024
  
  scene.add(spotLight)


  /** hemisphereLight */
  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x333333)

  hemisphereLight.position.set(0, 20, 10)

  scene.add(hemisphereLight);


  /** animation */
  const mixer = new THREE.AnimationMixer(model)
  
  const buttons = document.querySelector('.actions')

  let currentAction;

  const combatAniumations = gltf.animations.slice(0, 5)
  const dancingAniumations = gltf.animations.slice(5)

  combatAniumations.forEach(animation =>{
    const button = document.createElement('button');

    button.innerText = animation.name;
    buttons.appendChild(button)
    button.addEventListener('click',()=>{
      const previousAction = currentAction;
      currentAction = mixer.clipAction(animation)
      
      if(previousAction !== currentAction){
        previousAction.fadeOut(0.5)
        currentAction.reset().fadeIn(0.5).play()
      }
    })

  })

  const hasAnimation = gltf.animations.length !== 0;

  if(hasAnimation){
    currentAction = mixer.clipAction(gltf.animations[0])
    
    currentAction.play()
  }
  /** Control */
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.minDistance = 15
  controls.maxDistance = 25
  controls.minPolarAngle = Math.PI / 4
  controls.maxPolarAngle = Math.PI / 3

  /** 클릭된 지점의 정보를 얻는 raycaster */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();




  const clock = new THREE.Clock()

  render() //랜더 되는 부분
  function render() {
    const delta = clock.getDelta()
    mixer.update(delta)
    controls.update()
    renderer.render(scene,camera)

    requestAnimationFrame(render);
  }

  function handleResize(){ //애니메이션 작동
    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth,window.innerHeight)

    renderer.render(scene, camera)

  }

  window.addEventListener('resize',handleResize)



  function handlePointerDown(e) {
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2,
    pointer.y =  -(e.clientY / window.innerHeight - 0.5) * 2
    raycaster.setFromCamera(pointer, camera);
    
    const intersects = raycaster.intersectObjects(scene.children)

    const object= intersects[0]?.object;

    if (object?.name  === 'Ch46'){
      const previousAction = currentAction;

      const index = Math.round(Math.random() * (dancingAniumations.length -1))

      currentAction = mixer.clipAction(dancingAniumations[index])

      currentAction.loop = THREE.LoopOnce  // THREE.LoopRepeat
      
      currentAction.clampWhenFinished = true;

      if(previousAction !== currentAction){
        previousAction.fadeOut(0.5)
        currentAction.reset().fadeIn(0.5).play()
      }

      mixer.addEventListener('finished', handleFinished);
      
      function handleFinished(){
        const previousAction = currentAction;
        
        currentAction = mixer.clipAction(combatAniumations[0]);

        previousAction.fadeOut(0.5)
        currentAction.reset().fadeIn(0.5).play()
      }
    }  

  }

  window.addEventListener('pointerdown',handlePointerDown)
}

