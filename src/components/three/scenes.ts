import * as THREE from 'three'
import type { GameState, Staff } from '../../game/types'
import { activeCards } from '../../game/gpu'
import { maxStaff, onLeave } from '../../game/state'
import { campusLayout } from '../campusLayout'
import { Models } from './models'

export type Place3D = 'office' | 'campus' | 'lab' | 'hall'
export interface World { root: THREE.Group; width: number; depth: number; models: Models }

function room(m: Models, root: THREE.Group, w: number, d: number, lab = false) {
  m.box(root, '#263b48', 0, -0.35, 0, w + 0.5, 0.6, d + 0.5)
  for (let x = 0; x < Math.ceil(w); x++) for (let z = 0; z < Math.ceil(d); z++)
    m.box(root, (x + z) % 2 ? (lab ? '#78919b' : '#b0b9ae') : (lab ? '#829ba3' : '#bbc3b8'),
      x - w / 2 + 0.5, -0.025, z - d / 2 + 0.5, 0.985, 0.06, 0.985)
  m.box(root, '#adc3c5', 0, 1.6, -d / 2, w, 3.2, 0.2)
  // Cutaway side wall keeps people visible from the default camera.
  m.box(root, '#76969f', -w / 2, 0.75, 0, 0.2, 1.5, d)
  m.box(root, '#3c616e', 0, 0.12, -d / 2 + 0.13, w, 0.24, 0.08)
  for (let x = -w / 2 + 2; x < w / 2 - 1; x += 3.5) {
    m.box(root, '#577b8b', x, 2.05, -d / 2 + 0.13, 2.3, 1.6, 0.12)
    m.box(root, '#aadce8', x, 2.08, -d / 2 + 0.2, 2.05, 1.34, 0.05, true)
    m.box(root, '#e2eee7', x, 2.05, -d / 2 + 0.25, 0.05, 1.4, 0.04)
    m.box(root, '#e2eee7', x, 2.05, -d / 2 + 0.25, 2.1, 0.05, 0.04)
  }
  const exit = m.group(root, w / 2 - 1.5, 0, d / 2 - 0.3)
  exit.userData = { place: 'campus', label: 'Go outside' }
  m.box(exit, '#437f78', 0, 0.035, 0, 2, 0.08, 0.55)
  m.sign(exit, 'EXIT →', 0, 0.6, 0.1, 1.8)
  m.plant(root, -w / 2 + 0.7, d / 2 - 0.9)
  m.plant(root, w / 2 - 0.8, -d / 2 + 0.8)
}

function amenity(m: Models, root: THREE.Group, id: string, x: number, z: number) {
  const g = m.group(root, x, 0, z)
  if (id === 'coffee') {
    m.box(g, '#937457', 0, 0.6, 0, 2, 1.2, 0.9)
    m.box(g, '#e4d8b9', 0, 1.24, 0, 2.15, 0.1, 1)
    m.box(g, '#33414e', -0.3, 1.65, 0, 0.75, 0.75, 0.6)
    m.box(g, '#bacdd2', -0.3, 1.68, 0.31, 0.56, 0.5, 0.04)
    m.mesh(g, 'cylinder', '#f4e3c6', -0.3, 1.35, 0.35, 0.18, 0.18, 0.18)
    m.sign(g, 'COFFEE', 0, 2.35, 0, 1.6)
  } else if (id === 'gym') {
    m.box(g, '#344b5b', 0, 0.25, 0, 1.2, 0.2, 2)
    m.box(g, '#172a37', 0, 0.37, 0.1, 0.95, 0.04, 1.6)
    for (const side of [-1, 1]) m.box(g, '#afc6c8', side * 0.55, 0.85, -0.7, 0.08, 1.1, 0.08)
    m.box(g, '#466675', 0, 1.4, -0.7, 1.2, 0.22, 0.35)
  } else if (id === 'cooling') {
    m.box(g, '#b7ced2', 0, 1, 0, 1.3, 2, 0.8)
    for (let i = 0; i < 7; i++) m.box(g, '#3c6775', 0, 0.35 + i * 0.22, 0.42, 1.05, 0.09, 0.04)
    m.mesh(g, 'cylinder', '#65d6e8', 0.8, 0.3, 0, 0.12, 0.6, 0.12)
  } else {
    m.box(g, '#c7a982', 0, 0.9, 0, 2.3, 0.13, 1.2)
    for (const side of [-1, 1]) {
      m.box(g, '#425b69', side * 0.8, 0.45, 0, 0.1, 0.9, 0.8)
      m.box(g, '#659188', side * 0.65, 0.55, 0.95, 0.6, 0.15, 0.6)
    }
    m.sign(g, id === 'academy' ? 'LEARNING LAB' : 'IDEAS ROOM', 0, 1.8, -0.5, 2)
  }
}

function office(m: Models, root: THREE.Group, state: GameState) {
  const staff = state.staff.filter(person => person.role !== 'hardware')
  const count = Math.max(maxStaff(state), staff.length)
  const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(count * 1.5))))
  const rows = Math.ceil(count / cols)
  const width = Math.max(14, cols * 3.1 + 3)
  const depth = rows * 3.2 + 7
  room(m, root, width, depth)
  m.sign(root, state.companyName, 0, 3.1, -depth / 2 + 0.22, 4)
  for (let i = 0; i < count; i++) {
    const x = (i % cols - (cols - 1) / 2) * 3.1
    const z = -depth / 2 + 2.4 + Math.floor(i / cols) * 3.2
    m.desk(root, x, z, i)
    const person = staff[i]
    if (person && !onLeave(state, person.id)) {
      const worker = m.person(root, person, x, z + 1, true)
      worker.rotation.y = Math.PI
    }
  }
  const front = depth / 2 - 1.8
  // Lounge and upgrades occupy a separate strip in front of the workstations.
  m.box(root, '#417e80', -width / 2 + 2.5, 0.6, front, 3, 0.6, 1.1)
  m.box(root, '#4a8c88', -width / 2 + 2.5, 1, front + 0.45, 3, 0.9, 0.2)
  for (const side of [-1, 1]) m.box(root, '#356c71', -width / 2 + 2.5 + side * 1.45, 0.8, front, 0.2, 0.7, 1.2)
  state.amenities.forEach((id, index) => {
    // Grow the upgrade strip sideways outside the work area, never through desks.
    amenity(m, root, id, -width / 2 + 6 + (index % 3) * 2.8, front - Math.floor(index / 3) * 2)
  })
  return { width, depth }
}

function laboratory(m: Models, root: THREE.Group, state: GameState) {
  const staff = state.staff.filter(person => person.role === 'hardware')
  const rows = Math.max(2, Math.ceil(staff.length / 2))
  const width = 17, depth = Math.max(13, rows * 3 + 4)
  room(m, root, width, depth, true)
  m.sign(root, 'SILICON & RESEARCH', 0, 3.1, -depth / 2 + 0.22, 4)
  for (let i = 0; i < Math.max(4, staff.length); i++) {
    const x = i % 2 ? 5.5 : -5.5, z = -depth / 2 + 2.2 + Math.floor(i / 2) * 3
    m.desk(root, x, z, i, true)
    if (staff[i] && !onLeave(state, staff[i].id)) m.person(root, staff[i], x, z + 1, true).rotation.y = Math.PI
  }
  const rig = m.group(root, 0, 0, -0.5)
  m.box(rig, '#d8dfd4', 0, 0.25, 0, 3.3, 0.5, 3.3)
  for (const x of [-1.25, 1.25]) for (const z of [-1.25, 1.25])
    m.box(rig, '#607f90', x, 2, z, 0.2, 3.5, 0.2)
  m.box(rig, '#b7d0d9', 0, 3.8, 0, 3, 0.3, 3)
  const core = m.mesh(rig, 'sphere', '#65d9ed', 0, 2, 0, 1.4, 1.4, 1.4, true)
  core.userData.dynamic = true
  for (let i = 0; i < 4; i++) {
    const geometry = new THREE.TorusGeometry(0.95, 0.055, 6, 32)
    m.geometries.set(`rig-ring-${i}`, geometry)
    const ring = new THREE.Mesh(geometry, m.material('#5fc8ee', true))
    ring.rotation.x = Math.PI / 2
    ring.position.y = 1 + i * 0.65; rig.add(ring)
  }
  m.animations.push(time => { core.rotation.y = time * 0.45; core.position.y = 2 + Math.sin(time * 1.6) * 0.18 })
  m.monitor(rig, 0, 0.5, 1.7)
  m.sign(root, 'NEURAL TEST CHAMBER', 0, 0.7, 2.3, 3.3)
  amenity(m, root, 'cooling', width / 2 - 1.4, depth / 2 - 2)
  return { width, depth }
}

function hall(m: Models, root: THREE.Group, state: GameState) {
  const width = 21, depth = 13
  room(m, root, width, depth, true)
  m.sign(root, 'COMPUTE / SERVER FLOOR', 0, 3.1, -depth / 2 + 0.22, 4.5)
  const cards = activeCards(state)
  // Each rack represents an equal share when the fleet outgrows individual slots.
  const perSlot = Math.max(1, Math.ceil(cards / 112))
  for (let row = 0; row < 2; row++) for (let i = 0; i < 7; i++) {
    const count = Math.max(0, Math.min(8, Math.ceil(cards / perSlot) - (row * 7 + i) * 8))
    m.rack(root, -8 + i * 2.4, -3.5 + row * 5, count, row * 7 + i)
  }
  for (const z of [-3.5, 1.5]) {
    amenity(m, root, 'cooling', 9, z)
    m.box(root, '#d2b177', -0.5, 3.65, z, 18, 0.13, 0.35)
    m.box(root, '#5dc2d0', -0.5, 3.75, z, 18, 0.035, 0.08, true)
  }
  const tech = m.person(root, { id: 'hall-technician', name: 'Technician', role: 'engineer' } as Staff, 0, 0)
  tech.userData = { label: 'Datacenter technician', dynamic: true }
  m.animations.push(time => { tech.position.x = Math.sin(time * 0.2) * 7; tech.rotation.y = Math.cos(time * 0.2) > 0 ? Math.PI / 2 : -Math.PI / 2 })
  return { width, depth }
}

function campus(m: Models, root: THREE.Group, state: GameState) {
  const width = 46, depth = 25
  m.box(root, '#536f58', 0, -0.4, 0, width, 0.8, depth)
  m.box(root, '#789578', 0, 0.015, 0, width - 0.3, 0.05, depth - 0.3)
  m.box(root, '#3b4d57', 0, 0.075, 9.5, width, 0.1, 3)
  for (let x = -22; x < 22; x += 2.5) m.box(root, '#d7d5b4', x, 0.14, 9.5, 1.3, 0.015, 0.09)
  const layout = campusLayout({ officeLevel: state.officeLevel, datacenters: state.datacenters,
    rentedDatacenters: state.rentedDatacenters, fabs: state.fabs, dataSources: state.dataSources.length })
  for (const footprint of layout) {
    const x = footprint.x + footprint.cols / 2 - 22
    const z = footprint.y + footprint.rows / 2 - 11
    if (footprint.kind === 'tree') {
      m.mesh(root, 'cylinder', '#866249', x, 0.8, z, 0.3, 1.6, 0.3)
      m.mesh(root, 'sphere', '#3d785b', x, 2.2, z, 2.2, 2.8, 2.2)
      m.mesh(root, 'sphere', '#6b9c65', x - 0.3, 2.8, z, 1.6, 1.6, 1.6)
      continue
    }
    if (footprint.kind === 'sign') continue
    const group = m.group(root, x, 0.08, z)
    group.userData = { label: footprint.label, place: footprint.kind === 'office' ? 'office'
      : footprint.kind === 'lab' || footprint.kind === 'fab' ? 'lab' : footprint.kind === 'hall' ? 'hall' : undefined }
    if (footprint.kind === 'dish') {
      m.mesh(group, 'cylinder', '#a9bcc3', 0, 0.8, 0, 0.15, 1.6, 0.15)
      const bowl = m.mesh(group, 'sphere', '#d9e5e1', 0, 1.65, 0, 1.3, 0.3, 1.3)
      bowl.rotation.z = 0.45
      m.mesh(group, 'cylinder', '#667f90', 0.15, 2, 0, 0.06, 0.7, 0.06).rotation.z = 0.45
      continue
    }
    const w = footprint.cols - 0.3, d = footprint.rows - 0.3
    const h = footprint.kind === 'office' ? 2.2 + Math.min(state.officeLevel, 4) * 0.8 : footprint.kind === 'fab' ? 2.8 : 2.2
    const color = footprint.kind === 'office' ? '#d6cbb6' : footprint.kind === 'lab' ? '#e1e8df'
      : footprint.kind === 'fab' ? '#9babc0' : footprint.leased ? '#a39178' : '#708d9e'
    m.box(group, '#b9b7a5', 0, 0.14, 0, w + 0.2, 0.28, d + 0.2)
    m.box(group, color, 0, h / 2 + 0.2, 0, w, h, d)
    m.box(group, '#496675', 0, h + 0.23, 0, w + 0.15, 0.18, d + 0.15)
    m.box(group, '#7c929b', 0, h + 0.35, 0, w - 0.4, 0.1, d - 0.4)
    for (let row = 0; row < Math.max(1, Math.floor(h / 1.1)); row++) {
      for (let column = 0; column < Math.floor(w / 1.4); column++) {
        const wx = -w / 2 + 0.8 + column * 1.4
        m.box(group, '#345b70', wx, 0.9 + row * 1.05, d / 2 + 0.02, 0.85, 0.65, 0.06)
        m.box(group, '#9fd6df', wx, 0.94 + row * 1.05, d / 2 + 0.06, 0.69, 0.48, 0.015, true)
      }
      for (let column = 0; column < Math.floor(d / 1.4); column++)
        m.box(group, '#7dafc4', w / 2 + 0.025, 0.95 + row * 1.05, -d / 2 + 0.8 + column * 1.4, 0.05, 0.55, 0.8, true)
    }
    m.box(group, '#224757', 0, 0.85, d / 2 + 0.08, 0.9, 1.45, 0.1)
    m.box(group, '#e4d2a0', 0, 1.65, d / 2 + 0.4, 1.5, 0.13, 0.85)
    m.sign(group, footprint.kind === 'office' ? state.companyName : footprint.label.toUpperCase(), 0, h - 0.15, d / 2 + 0.12, Math.min(w - 0.6, 4))
    for (let unit = 0; unit < Math.floor(w / 2.2); unit++) {
      const ux = -w / 2 + 1.2 + unit * 2.1
      m.box(group, '#b6c4c6', ux, h + 0.65, -0.2, 1.2, 0.5, 0.9)
      m.mesh(group, 'cylinder', '#405967', ux, h + 0.92, -0.2, 0.6, 0.04, 0.6)
    }
    if (footprint.kind === 'fab') m.mesh(group, 'cylinder', '#d0d4d2', w / 2 - 0.5, h + 0.8, -d / 2 + 0.6, 0.45, 2, 0.45)
    if (footprint.kind === 'office' || footprint.kind === 'lab') {
      const length = Math.max(0.1, 8 - (z + d / 2))
      m.box(root, '#c4c3ae', x, 0.07, z + d / 2 + length / 2, 1.5, 0.08, length)
    }
  }
  for (let i = 0; i < 4; i++) {
    const car = m.group(root, 0, 0.25, 8.7 + (i % 2) * 1.5)
    car.userData.dynamic = true
    m.box(car, ['#e4aa63', '#e0d9c2', '#6197b1', '#b86a58'][i], 0, 0.28, 0, 1.65, 0.4, 0.75)
    m.box(car, '#91bdcd', 0, 0.6, 0, 0.85, 0.3, 0.66)
    for (const side of [-1, 1]) for (const axle of [-0.5, 0.5])
      m.mesh(car, 'cylinder', '#293b44', axle, 0.12, side * 0.4, 0.3, 0.14, 0.3).rotation.x = Math.PI / 2
    m.animations.push(time => { car.position.x = ((time * (i % 2 ? -1.8 : 1.8) + i * 12) % 48 + 48) % 48 - 24 })
  }
  return { width, depth }
}

export function buildWorld(place: Place3D, state: GameState): World {
  const root = new THREE.Group(), models = new Models()
  const size = place === 'campus' ? campus(models, root, state) : place === 'lab' ? laboratory(models, root, state)
    : place === 'hall' ? hall(models, root, state) : office(models, root, state)
  models.batch(root)
  return { root, models, ...size }
}
