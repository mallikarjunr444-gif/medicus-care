// TEST-ONLY stand-in for Apple's phone model, so the intro can be exercised without the
// Apple assets. It reuses the mesh names main.js expects (see main.js model loop).
import * as THREE from 'three';
const Y = 5.8974; // main.js translates every mesh by -Y after scaling
const mat = (color, rough = .35, metal = .6) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
function plane(x0, x1, y0, y1, z, flip, name, material) {
  const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0, 200, 4);
  if (flip) g.rotateY(Math.PI);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2 + Y, z).scale(.01, .01, .01);
  const m = new THREE.Mesh(g, material); m.name = name; return m;
}
function slab(x0, x1, name, material) {
  const g = new THREE.BoxGeometry(x1 - x0, 11.6, .5, 40, 1, 1);
  g.translate((x0 + x1) / 2, Y, -.01).scale(.01, .01, .01);
  const m = new THREE.Mesh(g, material); m.name = name; return m;
}
export class USDLoader {
  async loadAsync() {
    const root = new THREE.Group();
    const moving = new THREE.Group(); moving.name = 'upTUAKvMVkPOMKq';
    const fixed = new THREE.Group(); fixed.name = 'SiftyleUEEZwLhF';
    const body = mat(0xd9d6cf);
    moving.add(slab(-8.1, -.35, 'coverBody', body));
    moving.add(plane(-7.97, -.234, .27173 - Y, .27173 + 11.2513 - Y, .56, true, 'hhgAIoCGsHXeDPY', new THREE.MeshBasicMaterial()));
    fixed.add(slab(.35, 8.1, 'cameraBody', body));
    for (const [cx, cy] of [[3.5, 3.2], [3.5, 1.2]]) {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .3, 32).rotateX(Math.PI / 2).translate(cx, cy + Y, -.15).scale(.01, .01, .01), mat(0x202226, .15, .9));
      lens.name = 'lens'; fixed.add(lens);
    }
    // flexible inner display + hinge strip (bent by the vertex shader near x = 0)
    moving.add(plane(-7.89935, 7.89935, .34562 - Y, .34562 + 11.1035 - Y, .24948, false, 'UXtsBZYlaUvHoEh', new THREE.MeshBasicMaterial()));
    root.add(moving, fixed);
    return root;
  }
}
