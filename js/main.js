$.getJSON('../data/test2.json', function(data) {
  var scene = init();
  var sim = loadtrack(scene, data['simulated'], 0xff0000);
  var reco = loadtrack(scene, data['reconstructed'], 0x0000ff);
});
var loadtrack = function(scene, track, color) {
  var geometry = new THREE.Geometry();
  geometry.vertices.push(new
          THREE.Vector3(track['yin'],track['zin'], track['xin']));
  geometry.vertices.push(new THREE.Vector3(track['yout'],
              track['zout'], track['xout']));
  var material = new THREE.LineBasicMaterial({color:
      color, linewidth: 2});
  var line = new THREE.Line(geometry, material);
  scene.add(line);
  return line;
};
var init = function() {
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa7a7a7);
  var camera = new THREE.PerspectiveCamera(75,
          window.innerWidth/window.innerHeight, 0.1, 1000);
  /*var camera = new THREE.OrthographicCamera(-20, 20, 20, -20,
    -10, 10);*/
  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  var cylindergeometry = new THREE.CylinderGeometry(2.25, 2.25, 4, 20, 1, true);
  var texture = new THREE.Texture();
  var material = new THREE.MeshBasicMaterial({color: 0x00ff00,
      side: THREE.DoubleSide, opacity: 0.5, transparent: true,
      wireframe: true});
  var cube = new THREE.Mesh(cylindergeometry, material);
  scene.add(cube);
  camera.position.z = 8;
  scene.add(camera);
  controls = new THREE.OrbitControls(camera);
  guiparams = {z: 8};
  var gui = new dat.GUI();
  var z = gui.add(guiparams, 'z', -10, 10);
  z.onChange(function(value) {
      camera.position.z = value;
  });
  var axes = new THREE.AxisHelper(1);
  axes.position.set(-5, 0, 0);
  scene.add(axes);
  var rpcgrid = new THREE.GridHelper(6, 10, 0, 0);
  rpcgrid.position.set(0, 4, 0);
  scene.add(rpcgrid);
  function render() {
      requestAnimationFrame(render);
      controls.update();
      renderer.render(scene, camera);
  };
  render();
  return scene;
};
