import FC from "./fc";
import * as THREE from "three";
import "./utils/three/Projector";
import { CanvasRenderer } from "./utils/three/CanvasRenderer";

// generate mixer
export const mixerList = [
    { name: "Tricopter", pos: 0, model: "tricopter", image: "tri", motors: 3, servos: true },
    { name: "Quad +", pos: 1, model: "quad_x", image: "quad_p", motors: 4, servos: false },
    { name: "Quad X", pos: 2, model: "quad_x", image: "quad_x", motors: 4, servos: false },
    { name: "Bicopter", pos: 3, model: "custom", image: "bicopter", motors: 2, servos: true },
    { name: "Gimbal", pos: 4, model: "custom", image: "custom", motors: 0, servos: true },
    { name: "Y6", pos: 5, model: "y6", image: "y6", motors: 6, servos: false },
    { name: "Hex +", pos: 6, model: "hex_plus", image: "hex_p", motors: 6, servos: false },
    { name: "Flying Wing", pos: 7, model: "custom", image: "flying_wing", motors: 1, servos: true },
    { name: "Y4", pos: 8, model: "y4", image: "y4", motors: 4, servos: false },
    { name: "Hex X", pos: 9, model: "hex_x", image: "hex_x", motors: 6, servos: false },
    { name: "Octo X8", pos: 10, model: "custom", image: "octo_x8", motors: 8, servos: false },
    { name: "Octo Flat +", pos: 11, model: "custom", image: "octo_flat_p", motors: 8, servos: false },
    { name: "Octo Flat X", pos: 12, model: "custom", image: "octo_flat_x", motors: 8, servos: false },
    { name: "Airplane", pos: 13, model: "custom", image: "airplane", motors: 1, servos: true },
    { name: "Heli 120", pos: 14, model: "custom", image: "custom", motors: 1, servos: true },
    { name: "Heli 90", pos: 15, model: "custom", image: "custom", motors: 0, servos: true },
    { name: "V-tail Quad", pos: 16, model: "quad_vtail", image: "vtail_quad", motors: 4, servos: false },
    { name: "Hex H", pos: 17, model: "custom", image: "custom", motors: 6, servos: false },
    { name: "PPM to SERVO", pos: 18, model: "custom", image: "custom", motors: 0, servos: true },
    { name: "Dualcopter", pos: 19, model: "custom", image: "custom", motors: 2, servos: true },
    { name: "Singlecopter", pos: 20, model: "custom", image: "custom", motors: 1, servos: true },
    { name: "A-tail Quad", pos: 21, model: "quad_atail", image: "atail_quad", motors: 4, servos: false },
    { name: "Custom", pos: 22, model: "custom", image: "custom", motors: 0, servos: false },
    { name: "Custom Airplane", pos: 23, model: "custom", image: "custom", motors: 1, servos: true },
    { name: "Custom Tricopter", pos: 24, model: "custom", image: "custom", motors: 3, servos: true },
    { name: "Quad X 1234", pos: 25, model: "quad_x", image: "quad_x_1234", motors: 4, servos: false },
    { name: "Octo X8 +", pos: 26, model: "custom", image: "custom", motors: 8, servos: false },
];

// 3D model
const Model = function (wrapper, canvas) {
    const useWebGLRenderer = this.canUseWebGLRenderer();

    this.wrapper = wrapper;
    this.canvas = canvas;

    if (useWebGLRenderer) {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas[0],
            alpha: true,
            antialias: false, // Disable antialiasing for performance
            precision: "lowp", // Use low precision for better performance
            powerPreference: "high-performance",
        });
    } else {
        this.renderer = new CanvasRenderer({
            canvas: this.canvas[0],
            alpha: true,
        });
    }

    // initialize render size for current canvas size
    this.renderer.setSize(this.wrapper.width(), this.wrapper.height());

    // Setup scene and objects
    this.scene = new THREE.Scene();
    this.modelWrapper = new THREE.Object3D();
    this.camera = new THREE.PerspectiveCamera(60, this.wrapper.width() / this.wrapper.height(), 1, 1000);
    this.camera.position.z = 125;

    // Setup lights
    const light = new THREE.AmbientLight(0x404040);
    const light2 = new THREE.DirectionalLight(new THREE.Color(1, 1, 1), 1.5);
    light2.position.set(0, 1, 0);

    // Add objects to scene
    this.scene.add(light);
    this.scene.add(light2);
    this.scene.add(this.camera);
    this.scene.add(this.modelWrapper);

    // Apply canvas renderer optimizations if needed
    if (!useWebGLRenderer) {
        this.applyCanvasRendererOptimizations();
    }

    // Load the model
    let model_file = mixerList[FC.MIXER_CONFIG.mixer - 1].image;
    console.log("model_file", model_file);

    if (model_file == "custom") {
        model_file = "fallback";
    }

    this.loadJSON(
        model_file,
        function (model) {
            this.model = model;
            this.modelWrapper.add(model);
            this.scene.add(this.modelWrapper);

            if (!useWebGLRenderer) {
                this.applyCanvasRendererOptimizations();
            }

            this.render();
        }.bind(this),
    );
};

Model.prototype.loadJSON = function (model_file, callback) {
    const loader = new THREE.JSONLoader();
    const startTime = performance.now();

    loader.load(`./resources/models/${model_file}.json`, function (geometry, materials) {
        // Geometry optimizations
        geometry.mergeVertices();
        geometry.computeBoundingSphere();

        // Create model
        const model = new THREE.Mesh(geometry, materials);
        model.scale.set(15, 15, 15);

        const loadTime = performance.now() - startTime;
        console.log(`Model loading stats:
            Load time: ${loadTime.toFixed(2)}ms
            Vertices: ${geometry.vertices ? geometry.vertices.length : "N/A"}
            Faces: ${geometry.faces ? geometry.faces.length : "N/A"}
            Memory: ${(geometry.attributes ? geometry.attributes.position.array.byteLength : 0) / 1024} KB`);

        callback(model);
    });
};

Model.prototype.canUseWebGLRenderer = function () {
    // Temporary override for testing - force Canvas renderer
    const FORCE_CANVAS_RENDERER = true;
    if (FORCE_CANVAS_RENDERER) {
        return false;
    }

    // Original WebGL detection logic (currently disabled)
    try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        return !!context;
    } catch (e) {
        return false;
    }
};

Model.prototype.rotateTo = function (x, y, z) {
    if (!this.model) {
        return;
    }

    const startTime = performance.now();

    this.model.rotation.x = x;
    this.modelWrapper.rotation.y = y;
    this.model.rotation.z = z;

    this.model.updateMatrix();
    this.modelWrapper.updateMatrix();

    const rotateTime = performance.now() - startTime;
    if (this.rotateCount === undefined) {
        this.rotateCount = 0;
        this.rotateTimeSum = 0;
    }

    this.rotateCount++;
    this.rotateTimeSum += rotateTime;

    if (this.rotateCount % 100 === 0) {
        console.log(`Rotation stats:
            Average rotation time: ${(this.rotateTimeSum / this.rotateCount).toFixed(2)}ms
            Total rotations: ${this.rotateCount}`);
        this.rotateCount = 0;
        this.rotateTimeSum = 0;
    }

    this.render();
};

Model.prototype.rotateBy = function (x, y, z) {
    if (!this.model) {
        return;
    }

    const startTime = performance.now();

    this.model.rotateX(x);
    this.model.rotateY(y);
    this.model.rotateZ(z);

    this.model.updateMatrix();
    this.modelWrapper.updateMatrix();

    const rotateTime = performance.now() - startTime;
    if (this.rotateByCount === undefined) {
        this.rotateByCount = 0;
        this.rotateByTimeSum = 0;
    }

    this.rotateByCount++;
    this.rotateByTimeSum += rotateTime;

    if (this.rotateByCount % 100 === 0) {
        console.log(`RotateBy stats:
            Average rotation time: ${(this.rotateByTimeSum / this.rotateByCount).toFixed(2)}ms
            Total rotations: ${this.rotateByCount}`);
        this.rotateByCount = 0;
        this.rotateByTimeSum = 0;
    }

    this.render();
};

Model.prototype.render = function () {
    if (!this.model) {
        return;
    }

    const startTime = performance.now();

    // Always update matrices for Canvas renderer
    this.model.updateMatrix();
    this.model.updateMatrixWorld();
    this.modelWrapper.updateMatrix();
    this.modelWrapper.updateMatrixWorld();

    // draw
    this.renderer.render(this.scene, this.camera);

    const endTime = performance.now();
    const frameTime = endTime - startTime;

    // Log performance every 100 frames
    if (this.frameCount === undefined) {
        this.frameCount = 0;
        this.frameTimeSum = 0;
        this.lastFpsUpdate = performance.now();
    }

    this.frameCount++;
    this.frameTimeSum += frameTime;

    if (endTime - this.lastFpsUpdate >= 1000) {
        const fps = this.frameCount / ((endTime - this.lastFpsUpdate) / 1000);
        const avgFrameTime = this.frameTimeSum / this.frameCount;
        console.log(`Render stats:
            FPS: ${fps.toFixed(2)}
            Avg Frame Time: ${avgFrameTime.toFixed(2)}ms
            Matrix Updates: ${this.model.matrixWorldNeedsUpdate ? "Yes" : "No"}`);

        // Reset counters
        this.frameCount = 0;
        this.frameTimeSum = 0;
        this.lastFpsUpdate = endTime;
    }
};

// handle canvas resize
Model.prototype.resize = function () {
    this.renderer.setSize(this.wrapper.width(), this.wrapper.height());

    this.camera.aspect = this.wrapper.width() / this.wrapper.height();
    this.camera.updateProjectionMatrix();

    this.render();
};

Model.prototype.dispose = function () {
    if (this.renderer) {
        if (this.renderer.forceContextLoss) {
            this.renderer.forceContextLoss();
        }
        if (this.renderer.dispose) {
            this.renderer.dispose();
        }
        this.renderer = null;
    }
};

Model.prototype.applyCanvasRendererOptimizations = function () {
    // Scene optimizations
    this.scene.autoUpdate = false;

    // Camera optimizations
    this.camera.matrixAutoUpdate = false;
    this.camera.updateMatrix();
    this.camera.updateMatrixWorld();

    // Model and wrapper optimizations
    if (this.model) {
        this.model.matrixAutoUpdate = true; // Enable for smoother movement
        this.model.frustumCulled = true;
        this.model.renderOrder = 0;
    }

    this.modelWrapper.matrixAutoUpdate = false;
    this.modelWrapper.updateMatrix();
    this.modelWrapper.updateMatrixWorld();

    // Light optimizations
    this.scene.children.forEach((child) => {
        if (child.isLight) {
            child.matrixAutoUpdate = false;
            child.updateMatrix();
        }
    });
};

export default Model;
