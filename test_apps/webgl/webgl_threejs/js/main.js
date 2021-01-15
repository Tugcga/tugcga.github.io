import * as THREE from './three.module.js';

const width = 1024;
const height = 768;
var LIMIT = 1000;
const POSITION_WIDTH = 8;
const POSITION_HEIGHT = 4;
const G = -9.8;
const aspect = width / height;
const dummy = new THREE.Object3D();
const renderer = new THREE.WebGLRenderer();

var camera, scene, plane, totalMesh, sphereGeometry, sphereMaterial;
var totalCount = 0;
var objectsData = [];
var lastUpdateTime = 0.0;
var lastFPSUpdate = 0.0;
var fpsAccumulator = 0.0;
var fpsSteps = 0;

init();
update();

function init()
{
	renderer.setSize(width, height);
	renderer.setClearColor(0x4A4A4A, 1);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	document.getElementById("container").appendChild(renderer.domElement);
	
	//set camera
	camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 500);
	camera.position.set(7, 3.35, -11.75);
	camera.lookAt(0, 0, 0);
	
	//create the scene
	scene = new THREE.Scene();
	
	//add to the scene
	const planeGeometry = new THREE.PlaneGeometry(40, 40);
	const planeMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff } );
	plane = new THREE.Mesh(planeGeometry, planeMaterial);
	plane.rotation.x = -1.57;
	plane.receiveShadow = true;
	scene.add(plane);
		
	sphereGeometry = new THREE.SphereBufferGeometry(0.5, 32, 32);
	sphereMaterial = new THREE.MeshPhongMaterial({color: 0xFF7800, shininess: 10});
	totalMesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, LIMIT);
	totalMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
	totalMesh.receiveShadow = true;
	totalMesh.castShadow = true;
	scene.add(totalMesh);
	
	//add light
	const ambientLight = new THREE.AmbientLight(0x6B7AA0);
	scene.add(ambientLight);
	const directionalLight = new THREE.DirectionalLight(0xFFF4D6, 1.0);
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 512;
	directionalLight.shadow.mapSize.height = 512;
	directionalLight.shadow.camera.near = 0.01;
	directionalLight.shadow.camera.far = 1000;
	directionalLight.shadow.camera.zoom = 0.5;
	directionalLight.position.set(20, 20, -10);
	//const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    //scene.add(cameraHelper);
	scene.add(directionalLight);
	
	//callbacks
	renderer.domElement.addEventListener("click", onMouseClick, false);
	setCount();
	setFPS(0.0);
}

function setCount()
{
	document.getElementById("count").innerHTML = "Objects count: " + totalCount.toString();
}

function setFPS(fpsValue)
{
	document.getElementById("fps").innerHTML = "FPS: " + fpsValue.toString();
}

function getRandom(min, max) 
{
	return Math.random() * (max - min) + min;
}

function onMouseClick()
{
	const newCount = Math.floor(totalCount/2) + 1
	
	//add objects to the buffer
	if(totalCount + newCount > totalMesh.count)
	{
		scene.remove(totalMesh);
		totalMesh.dispose();
		LIMIT = 4*LIMIT;
		console.log("update instance mesh to", LIMIT);
		totalMesh = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, LIMIT);		
		totalMesh.receiveShadow = true;
		totalMesh.castShadow = true;
		
		scene.add(totalMesh);
	}
	
	for(let i = 0; i < newCount; i++)
	{
		objectsData.push(
		{x: getRandom(-POSITION_WIDTH, POSITION_WIDTH),
		 y: getRandom(POSITION_HEIGHT / 4, POSITION_HEIGHT),
		 z: getRandom(-POSITION_WIDTH, POSITION_WIDTH),
		 s: getRandom(0.25, 1.0),
		 v: 0.0});
	}
	totalCount += newCount;
	
	setCount();
}

function update() 
{
	requestAnimationFrame(update);
	
	var currentTime = Date.now();
    var deltaTime = (currentTime - lastUpdateTime) * 0.001;
    lastUpdateTime = currentTime;
	
	//actual update of the scene
	for(let i = 0; i < totalCount; i++)
	{
		//recalculate the velocity and position
		objectsData[i].v += G * deltaTime;
		objectsData[i].y += objectsData[i].v * deltaTime;
		
		if(objectsData[i].y < 0.0)
		{
			objectsData[i].v *= -1;
			objectsData[i].y *= -1;
		}
		
		//set position to the instance
		dummy.position.set(objectsData[i].x, objectsData[i].y + 0.5*objectsData[i].s, objectsData[i].z);
		dummy.scale.set(objectsData[i].s, objectsData[i].s, objectsData[i].s);
		dummy.updateMatrix();
		totalMesh.setMatrixAt(i, dummy.matrix);
	}
	totalMesh.instanceMatrix.needsUpdate = true;
	
	//update fps
	if(currentTime - lastFPSUpdate > 1000)
	{
		setFPS(fpsSteps / fpsAccumulator);
		lastFPSUpdate = currentTime;
		fpsAccumulator = 0.0;
		fpsSteps = 0;
	}
	
	fpsAccumulator += deltaTime;
	fpsSteps += 1;
	
	//render call
	renderer.render(scene, camera);
}