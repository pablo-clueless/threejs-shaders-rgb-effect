import * as THREE from 'three'
import vertexShader from './shaders/vertextShader.glsl'
import fragmentShader from './shaders/fragmentShader.glsl'

const scrollable = document.querySelector('.scrollable')

let current = 0
let target = 0
let ease = 0.075

function lerp(start, end, t) {
  return start * (1 - t) + end * t
}

function init() {
  document.body.style.height = `${scrollable.getBoundingClientRect().height}px`
}

function smoothScroll() {
  target = scrollY
  current = lerp(current, target, ease)
  scrollable.style.transform = `translate3d(0, ${-current}px, 0)`
}

class EffectCanvas {
  constructor() {
    this.container = document.querySelector('main')
    this.images = [...document.querySelectorAll('img')]
    this.meshItems = []
    this.setupCamera()
    this.createMeshItems()
    this.render()
  }

  get viewport() {
    let width = innerWidth
    let height = innerHeight
    let aspectRatio = width / height
    return { width, height, aspectRatio }
  }

  setupCamera() {
    window.addEventListener('resize', this.onWindowResize.bind(this), false)

    this.scene = new THREE.Scene()

    let perspective = 1000
    const fov = (180 * (2 * Math.atan(innerHeight / 2 / perspective))) / Math.PI
    this.camera = new THREE.PerspectiveCamera(fov, this.viewport.aspectRatio, 1, 1000)
    this.camera.position.set(0, 0, perspective)

    this.renderer = new THREE.WebGL1Renderer({ antialias: true, alpha: true })
    this.renderer.setSize(this.viewport.width, this.viewport.height)
    this.renderer.setPixelRatio(devicePixelRatio)
    this.container.appendChild(this.renderer.domElement)
  }

  onWindowResize() {
    init()
    this.camera.aspect = this.viewport.aspectRatio
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.viewport.width, this.viewport.height)
  }

  createMeshItems() {
    this.images.forEach(image => {
      let meshItem = new MeshItem(image, this.scene)
      this.meshItems.push(meshItem)
    })
  }

  render() {
    smoothScroll()
    for(let i = 0; i < this.meshItems.length; i++) {
      this.meshItems[i].render()
    }
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this.render.bind(this))
  }
}

class MeshItem {
  constructor(element, scene) {
    this.element = element
    this.scene = scene
    this.offset = new THREE.Vector2(0, 0)
    this.sizes = new THREE.Vector2(0, 0)
    this.createMesh()
  }
  
  getDimensions() {
    const { width, height, top, left } = this.element.getBoundingClientRect()
    this.sizes.set(width, height)
    this.offset.set(left - innerWidth / 2 + width / 2, -top + innerHeight / 2 - height / 2)
  }

  createMesh() {
    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 30, 30)
    this.imageTexture = new THREE.TextureLoader().load(this.element.src)
    this.uniforms = { 
      uTexture:  { value: this.imageTexture },
      uOffset: { value: new THREE.Vector2(0.0, 0.0) },
      uAlpha: { value: 1 },
    }
    this.material = new THREE.ShaderMaterial({ 
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.getDimensions()
    this.mesh.position.set(this.offset.x, this.offset.y, 0)
    this.mesh.scale.set(this.sizes.x, this.sizes.y, 0)

    this.scene.add(this.mesh)
  }
  
  render() {
    this.getDimensions()
    this.mesh.position.set(this.offset.x, this.offset.y, 0)
    this.mesh.scale.set(this.sizes.x, this.sizes.y, 0)
    this.uniforms.uOffset.value.set(0.0, -(target - current) * 0.0002)
  }
}

init()
new EffectCanvas()