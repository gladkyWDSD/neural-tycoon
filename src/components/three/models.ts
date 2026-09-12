import * as THREE from 'three'
import type { Staff } from '../../game/types'
import { hash, lookFor } from '../sprites'

/** Per-scene resources are shared by all models and released when leaving a room. */
export class Models {
  readonly geometries = new Map<string, THREE.BufferGeometry>()
  readonly materials = new Map<string, THREE.MeshStandardMaterial>()
  readonly textures: THREE.Texture[] = []
  readonly animations: ((time: number) => void)[] = []

  material(color: string, glow = false) {
    const key = color + glow
    let material = this.materials.get(key)
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.08,
        emissive: glow ? color : '#000000', emissiveIntensity: glow ? 0.65 : 0, flatShading: true })
      this.materials.set(key, material)
    }
    return material
  }

  mesh(parent: THREE.Object3D, shape: string, color: string, x: number, y: number, z: number,
    w: number, h: number, d: number, glow = false) {
    let geometry = this.geometries.get(shape)
    if (!geometry) {
      geometry = shape === 'sphere' ? new THREE.IcosahedronGeometry(0.5, 1)
        : shape === 'cylinder' ? new THREE.CylinderGeometry(0.5, 0.5, 1, 12)
        : shape === 'cone' ? new THREE.ConeGeometry(0.5, 1, 8)
        : new THREE.BoxGeometry(1, 1, 1)
      this.geometries.set(shape, geometry)
    }
    const mesh = new THREE.Mesh(geometry, this.material(color, glow))
    mesh.position.set(x, y, z)
    mesh.scale.set(w, h, d)
    mesh.castShadow = !glow
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }

  box(parent: THREE.Object3D, color: string, x: number, y: number, z: number,
    w: number, h: number, d: number, glow = false) {
    return this.mesh(parent, 'box', color, x, y, z, w, h, d, glow)
  }

  group(parent: THREE.Object3D, x = 0, y = 0, z = 0) {
    const group = new THREE.Group()
    group.position.set(x, y, z)
    parent.add(group)
    return group
  }

  sign(parent: THREE.Object3D, text: string, x: number, y: number, z: number, width = 3) {
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 96
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#132735'; ctx.fillRect(0, 0, 512, 96)
    ctx.fillStyle = '#79e2c3'; ctx.fillRect(0, 88, 512, 8)
    ctx.fillStyle = '#f1f7f5'; ctx.font = '600 32px sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(text.slice(0, 28), 256, 46, 480)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    this.textures.push(texture)
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 })
    this.materials.set(`sign-${this.textures.length}`, material)
    const mesh = this.box(parent, '#172d3b', x, y, z, width, width * 96 / 512, 0.06)
    mesh.material = material
    return mesh
  }

  plant(parent: THREE.Object3D, x: number, z: number, scale = 1) {
    const group = this.group(parent, x, 0, z)
    group.scale.setScalar(scale)
    this.mesh(group, 'cylinder', '#c48863', 0, 0.23, 0, 0.6, 0.46, 0.6)
    this.mesh(group, 'cylinder', '#483e34', 0, 0.47, 0, 0.51, 0.03, 0.51)
    this.box(group, '#456f48', 0, 0.9, 0, 0.08, 0.9, 0.08)
    for (let i = 0; i < 5; i++) {
      const angle = i * 2.4
      const leaf = this.mesh(group, 'sphere', i % 2 ? '#468d69' : '#78ae74',
        Math.cos(angle) * 0.2, 0.8 + i * 0.13, Math.sin(angle) * 0.2, 0.55, 0.25, 0.45)
      leaf.rotation.z = Math.cos(angle) * 0.5
    }
    return group
  }

  monitor(parent: THREE.Object3D, x: number, y: number, z: number, seed = 0) {
    this.box(parent, '#253744', x, y + 0.1, z, 0.55, 0.06, 0.3)
    this.box(parent, '#465966', x, y + 0.28, z, 0.1, 0.35, 0.1)
    this.box(parent, '#23323e', x, y + 0.6, z, 1.12, 0.67, 0.12)
    this.box(parent, '#0e2739', x, y + 0.61, z + 0.065, 0.98, 0.53, 0.015, true)
    for (let row = 0; row < 5; row++) {
      const width = 0.22 + ((row * 13 + seed * 7) % 10) * 0.047
      this.box(parent, row % 2 ? '#71dab5' : '#77bff3', x - 0.4 + width / 2,
        y + 0.8 - row * 0.09, z + 0.08, width, 0.025, 0.01, true)
    }
  }

  desk(parent: THREE.Object3D, x: number, z: number, seed: number, lab = false) {
    const group = this.group(parent, x, 0, z)
    for (const dx of [-0.9, 0.9]) for (const dz of [-0.4, 0.4])
      this.box(group, '#445360', dx, 0.52, dz, 0.09, 1.04, 0.09)
    this.box(group, lab ? '#c3d5dc' : '#bf946c', 0, 1.1, 0, 2.15, 0.16, 1.15)
    this.box(group, '#31424c', 0, 1.195, 0.13, 1.3, 0.025, 0.72)
    this.monitor(group, 0, 1.19, -0.25, seed)
    this.box(group, '#b6c4c8', -0.06, 1.24, 0.39, 0.85, 0.045, 0.26)
    for (let i = 0; i < 7; i++) this.box(group, '#536875', -0.4 + i * 0.11, 1.267, 0.39, 0.06, 0.01, 0.16)
    this.mesh(group, 'sphere', '#e1e5df', 0.64, 1.26, 0.4, 0.18, 0.09, 0.25)
    this.mesh(group, 'cylinder', '#f3bc6a', 0.86, 1.33, -0.1, 0.2, 0.28, 0.2)
    this.mesh(group, 'cylinder', '#533d30', 0.86, 1.476, -0.1, 0.16, 0.01, 0.16)
    // A swivel chair, with a real seat, backrest and five feet.
    this.box(group, '#405c70', 0, 0.63, 1.05, 0.68, 0.13, 0.65)
    this.box(group, '#405c70', 0, 1.05, 1.34, 0.68, 0.8, 0.12)
    this.mesh(group, 'cylinder', '#a2afb6', 0, 0.34, 1.05, 0.1, 0.55, 0.1)
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5
      const foot = this.box(group, '#273b47', Math.cos(angle) * 0.2, 0.1, 1.05 + Math.sin(angle) * 0.2, 0.48, 0.06, 0.08)
      foot.rotation.y = -angle
    }
    return group
  }

  person(parent: THREE.Object3D, staff: Staff, x: number, z: number, seated = false) {
    const group = this.group(parent, x, 0, z)
    group.userData = { staffId: staff.id, label: `${staff.name} · ${staff.role}` }
    const palette = lookFor(staff).palette
    const seed = hash(staff.id)
    const body = this.group(group)
    body.userData.dynamic = true
    const base = seated ? 0.2 : 0
    for (const side of [-1, 1]) {
      this.box(body, palette.P, side * 0.15, 0.34 + base, 0, 0.23, 0.57, 0.28)
      this.box(body, '#22303b', side * 0.15, 0.1 + base, 0.08, 0.25, 0.16, 0.43)
    }
    this.box(body, palette.C, 0, 0.91 + base, 0, 0.66, 0.65, 0.4)
    if (staff.role === 'researcher' || staff.role === 'hardware') {
      for (const side of [-1, 1]) this.box(body, '#edf3eb', side * 0.26, 0.91 + base, 0.03, 0.17, 0.66, 0.44)
    }
    const arms: THREE.Group[] = []
    for (const side of [-1, 1]) {
      const arm = this.group(body, side * 0.43, 1.12 + base, 0)
      arm.userData.dynamic = true
      this.box(arm, palette.C, 0, -0.2, 0, 0.2, 0.42, 0.23)
      this.mesh(arm, 'sphere', palette.S, 0, -0.44, 0, 0.21, 0.24, 0.23)
      arms.push(arm)
    }
    this.mesh(body, 'cylinder', palette.S, 0, 1.29 + base, 0, 0.2, 0.2, 0.2)
    this.box(body, palette.S, 0, 1.58 + base, 0, 0.57, 0.54, 0.48)
    this.box(body, palette.H, 0, 1.86 + base, -0.035, 0.61, 0.17, 0.53)
    this.box(body, palette.H, 0, 1.63 + base, -0.235, 0.59, 0.43, 0.12)
    if (seed % 3 === 0) this.box(body, palette.H, -0.26, 1.54 + base, -0.04, 0.12, 0.54, 0.48)
    for (const side of [-1, 1]) this.box(body, '#20303a', side * 0.13, 1.64 + base, 0.245, 0.065, 0.075, 0.025)
    this.box(body, palette.S, 0, 1.52 + base, 0.29, 0.1, 0.1, 0.13)
    this.box(body, '#a26555', 0, 1.43 + base, 0.247, 0.16, 0.035, 0.025)
    if (staff.role === 'engineer') {
      this.box(body, '#63cbb4', 0, 1.97 + base, 0, 0.72, 0.07, 0.16)
      for (const side of [-1, 1]) this.box(body, '#324657', side * 0.34, 1.68 + base, 0, 0.12, 0.3, 0.23)
    }
    this.animations.push(time => {
      body.position.y = Math.sin(time * 2 + seed) * 0.025
      arms.forEach((arm, i) => { arm.rotation.x = (seated ? -0.8 : 0) + Math.sin(time * (seated ? 7 : 2) + seed + i * 2) * 0.12 })
    })
    return group
  }

  rack(parent: THREE.Object3D, x: number, z: number, cards: number, seed: number) {
    const group = this.group(parent, x, 0, z)
    this.box(group, '#243848', 0, 1.5, 0, 1.35, 3, 1.2)
    this.box(group, '#101e2a', 0, 1.53, 0.62, 1.15, 2.76, 0.08)
    this.box(group, '#7d96a5', 0, 3.03, 0, 1.4, 0.07, 1.25)
    for (let slot = 0; slot < 8; slot++) {
      const y = 0.34 + slot * 0.32
      this.box(group, slot < cards ? '#516777' : '#2a3c49', 0, y, 0.69, 1.05, 0.25, 0.1)
      for (let vent = 0; vent < 3; vent++) this.box(group, '#162a36', -0.33 + vent * 0.22, y, 0.75, 0.12, 0.12, 0.02)
      if (slot < cards) {
        const led = this.box(group, '#66efb5', 0.4, y + 0.03, 0.76, 0.07, 0.06, 0.02, true)
        led.userData.dynamic = true
        this.animations.push(time => { led.visible = Math.sin(time * 4 + slot + seed) > -0.6 })
      }
    }
    return group
  }

  /** Batch static geometry while retaining a click target for each instance.
   * Animated groups keep their transforms and receive their own smaller batches.
   */
  batch(root: THREE.Group) {
    root.updateWorldMatrix(true, true)
    const inverse = root.matrixWorld.clone().invert()
    const buckets = new Map<string, THREE.Mesh[]>()
    const visit = (object: THREE.Object3D) => {
      if (object.userData.dynamic) {
        if (object instanceof THREE.Group) this.batch(object)
        return
      }
      if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshStandardMaterial) {
        const key = object.geometry.uuid + object.material.uuid + object.castShadow
        const bucket = buckets.get(key) ?? []
        bucket.push(object); buckets.set(key, bucket)
      }
      for (const child of [...object.children]) visit(child)
    }
    for (const child of [...root.children]) visit(child)
    for (const meshes of buckets.values()) {
      const first = meshes[0]
      const batch = new THREE.InstancedMesh(first.geometry, first.material, meshes.length)
      batch.castShadow = first.castShadow; batch.receiveShadow = true
      batch.userData.targets = meshes.map((mesh, index) => {
        batch.setMatrixAt(index, inverse.clone().multiply(mesh.matrixWorld))
        let target: THREE.Object3D | null = mesh
        while (target && !target.userData.label) target = target.parent
        return target?.userData ?? {}
      })
      for (const mesh of meshes) mesh.removeFromParent()
      root.add(batch)
      batch.computeBoundingSphere()
    }
  }

  dispose() {
    this.geometries.forEach(value => value.dispose())
    this.materials.forEach(value => value.dispose())
    this.textures.forEach(value => value.dispose())
  }
}
