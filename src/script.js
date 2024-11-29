import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import FirefliesVertexShader from './shaders/fireFlies/vertex.glsl'
import FirefliesFragmentShader from './shaders/fireFlies/fragment.glsl'
import PortalVertexShader from './shaders/portal/vertex.glsl'
import PortalFragmentShader from './shaders/portal/fragment.glsl'

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Texture
 */

const bakedTexture = textureLoader.load("baked.jpg")
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace

/**
 * Materials
 */

const bakedMaterial = new THREE.MeshBasicMaterial({
    map: bakedTexture
})

// Pole Light Material
const poleLightMaterial = new THREE.MeshBasicMaterial({
    color : "#ffffe5"
})

// Portal Light Material

const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms : {
        uTime : { value : 0 },
        uColorStart: { value: new THREE.Color(0xff6bee) },
        uColorEnd: { value: new THREE.Color(0xffffff) }
    },
    vertexShader : PortalVertexShader,
    fragmentShader : PortalFragmentShader
})

// const portalLightMaterial = new THREE.MeshBasicMaterial(
//     {color : "#ffe3fa"}
// )

/**
 * Model
 */

gltfLoader.load(
    "portal.glb",
    (gltf) => {
        const bakedMesh = gltf.scene.children.find(child => child.name === "baked")
        bakedMesh.material = bakedMaterial
        const portalLight = gltf.scene.children.find(child => child.name === "portalLight")
        const poleLightAMesh = gltf.scene.children.find(child => child.name === "poleLightA")
        const poleLightBMesh = gltf.scene.children.find(child => child.name === "poleLightB")

        portalLight.material = portalLightMaterial
        poleLightAMesh.material = poleLightMaterial
        poleLightBMesh.material = poleLightMaterial

        scene.add(gltf.scene)
    }
)

/**
 * Fireflies
 */

const fireFliesGeometry = new THREE.BufferGeometry()
const fireFliesCount = 30
const positionArray = new Float32Array(fireFliesCount * 3)
const scaleArray = new Float32Array(fireFliesCount * 1)

for(let i=0; i < fireFliesCount; i++)
{
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = Math.random() * 1.5
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4
    scaleArray[i] = Math.random()
}
fireFliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
fireFliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

const fireFliesMaterial = new THREE.ShaderMaterial({
    uniforms:
    {
        uTime : { value : 0.0 },
        uPixelRatio : { value : Math.min(window.devicePixelRatio, 2) },
        uSize : { value : 150 },
    },
    vertexShader : FirefliesVertexShader,
    fragmentShader : FirefliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
})

gui.add(fireFliesMaterial.uniforms.uSize, 'value').min(0).max(50).step(1).name("FireFliesSize")

const fireFlies = new THREE.Points(fireFliesGeometry, fireFliesMaterial)
scene.add(fireFlies)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update fireflies
    fireFliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 4
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

debugObject.clearColor = "#201919"
renderer.setClearColor(debugObject.clearColor)
gui.addColor(debugObject, 'clearColor').onChange(() => {
    renderer.setClearColor(debugObject.clearColor)
})

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    fireFliesMaterial.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()