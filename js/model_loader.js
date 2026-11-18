/**
 * GLTF / GLB 3D Model Dynamic Loader & Meshy AI Diorama Integration
 * Tự động căn chỉnh kích thước (THREE.Box3), đổ bóng PBR, ẩn khối công trình cũ tránh đè hình
 * Hỗ trợ chọn file trực tiếp từ máy tính (Input File) và kéo thả Drag-and-Drop
 */

(function() {
  'use strict';

  const GLBManager = {
    activeModel: null,
    targetWidth: 110.0,
    proceduralVisible: false,

    init() {
      console.log('🚀 Khởi tạo GLB Model Manager & Meshy AI 3D Loader...');
      this.createHUDControls();
      this.setupDragAndDrop();
      this.checkAndAutoLoadDefaultModel();
    },

    // 1. TẠO NÚT BẤM GIAO DIỆN CHỌN FILE GLB TRÊN GÓC HUD
    createHUDControls() {
      // Input file ẩn
      let fileInput = document.getElementById('glb-file-input');
      if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'glb-file-input';
        fileInput.accept = '.glb,.gltf';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            this.loadFromFile(file);
          }
        });
      }

      // Khung nút điều khiển góc trên màn hình
      let hudContainer = document.getElementById('glb-hud-controls');
      if (!hudContainer) {
        hudContainer = document.createElement('div');
        hudContainer.id = 'glb-hud-controls';
        hudContainer.style.cssText = `
          position: fixed;
          top: 76px;
          right: 16px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(56, 189, 248, 0.4);
          border-radius: 10px;
          padding: 8px 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          font-family: 'Segoe UI', sans-serif;
          font-size: 12px;
          color: #f8fafc;
        `;

        hudContainer.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px; margin-bottom:2px;">
            <span style="font-weight:bold; color:#38bdf8; display:flex; align-items:center; gap:4px;">
              <span>📦</span> Meshy 3D Diorama
            </span>
            <span id="glb-status-tag" style="font-size:10px; padding:1px 6px; border-radius:4px; background:#475569; color:#cbd5e1;">Chưa nạp</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button id="btn-load-glb" style="
              background: linear-gradient(135deg, #0284c7, #0369a1);
              color: #ffffff;
              border: none;
              padding: 6px 10px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              font-size: 11px;
              display: flex;
              align-items: center;
              gap: 4px;
              transition: all 0.2s;
            ">
              📂 Nạp File .GLB
            </button>
            <button id="btn-toggle-procedural" style="
              background: #334155;
              color: #e2e8f0;
              border: 1px solid #475569;
              padding: 6px 8px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 11px;
              transition: all 0.2s;
            " title="Bật/Tắt các khối công trình code cũ">
              🏛️ Khối cũ: TẮT
            </button>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:4px; font-size:10px; color:#94a3b8;">
            <span>Kéo thả file .glb vào màn hình</span>
            <span id="glb-scale-info">Quy mô: 110m</span>
          </div>
        `;

        document.body.appendChild(hudContainer);

        // Gán sự kiện cho các nút
        const btnLoad = document.getElementById('btn-load-glb');
        if (btnLoad) {
          btnLoad.addEventListener('click', () => {
            fileInput.click();
          });
        }

        const btnToggle = document.getElementById('btn-toggle-procedural');
        if (btnToggle) {
          btnToggle.addEventListener('click', () => {
            this.proceduralVisible = !this.proceduralVisible;
            this.setProceduralVisibility(this.proceduralVisible);
            btnToggle.textContent = `🏛️ Khối cũ: ${this.proceduralVisible ? 'BẬT' : 'TẮT'}`;
            btnToggle.style.background = this.proceduralVisible ? '#059669' : '#334155';
          });
        }
      }
    },

    // 2. KÉO THẢ TRỰC TIẾP FILE .GLB VÀO CANVAS
    setupDragAndDrop() {
      const dropZone = window;

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
            this.loadFromFile(file);
          } else {
            if (typeof showToast === 'function') showToast('⚠️ Vui lòng chọn file định dạng .glb hoặc .gltf!');
          }
        }
      });
    },

    // 3. ĐỌC FILE TỪ BỘ NHỚ TRÌNH DUYỆT (FILE READER -> ARRAYBUFFER)
    loadFromFile(file) {
      if (typeof showToast === 'function') showToast(`⏳ Đang nạp mô hình 3D: ${file.name}...`);
      const statusTag = document.getElementById('glb-status-tag');
      if (statusTag) {
        statusTag.textContent = 'Đang tải...';
        statusTag.style.background = '#d97706';
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target.result;
        this.parseGLBBuffer(buffer, file.name);
      };
      reader.onerror = (err) => {
        console.error('Lỗi khi đọc file GLB:', err);
        if (typeof showToast === 'function') showToast('❌ Không thể đọc file 3D được chọn!');
      };
      reader.readAsArrayBuffer(file);
    },

    // 4. PARSE DỮ LIỆU GLB BẰNG THREE.GLTFLoader
    parseGLBBuffer(buffer, fileName = 'model.glb') {
      if (typeof THREE.GLTFLoader === 'undefined') {
        console.error('THREE.GLTFLoader chưa được nạp!');
        if (typeof showToast === 'function') showToast('❌ Thiếu thư viện THREE.GLTFLoader!');
        return;
      }

      const loader = new THREE.GLTFLoader();
      loader.parse(
        buffer,
        '',
        (gltf) => {
          this.applyModelToScene(gltf, fileName);
        },
        (error) => {
          console.error('Lỗi khi giải mã GLTF / GLB:', error);
          if (typeof showToast === 'function') showToast('❌ Lỗi khi phân tích mô hình 3D!');
        }
      );
    },

    // 5. TỰ ĐỘNG TÌM KIẾM VÀ LOAD FILE .GLB MẶC ĐỊNH TRONG THƯ MỤC DỰ ÁN
    checkAndAutoLoadDefaultModel() {
      if (typeof THREE.GLTFLoader === 'undefined') return;

      const candidates = [
        'models/sawmill.glb',
        'models/sawmill_preview.glb',
        'models/lumber_inc_diorama.glb',
        'models/lumber_inc.glb',
        'models/diorama.glb',
        'models/meshy_diorama.glb',
        'models/model.glb',
        'sawmill.glb',
        'lumber_inc_diorama.glb',
        'diorama.glb'
      ];

      const tryLoadCandidate = (index) => {
        if (index >= candidates.length) return;
        const path = candidates[index];
        const loader = new THREE.GLTFLoader();
        loader.load(
          path,
          (gltf) => {
            console.log(`✅ Đã tự động nạp mô hình 3D từ: ${path}`);
            this.applyModelToScene(gltf, path);
          },
          undefined,
          () => {
            // Thử candidate tiếp theo
            tryLoadCandidate(index + 1);
          }
        );
      };

      tryLoadCandidate(0);
    },

    // 6. TỰ ĐỘNG CĂN CHỈNH KÍCH THƯỚC (THREE.Box3), TÂM VÀ ĐỔ BÓNG SHADOW
    applyModelToScene(gltf, fileName = '3D Model') {
      if (typeof scene === 'undefined') {
        console.error('Scene Three.js chưa sẵn sàng!');
        return;
      }

      // Xóa model cũ nếu đã nạp trước đó
      if (this.activeModel) {
        scene.remove(this.activeModel);
        this.activeModel = null;
      }

      const model = gltf.scene || gltf.scenes[0];
      model.name = 'meshy_ai_glb_diorama';

      // Đo kích thước gốc bằng THREE.Box3
      const initialBox = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      initialBox.getSize(size);
      console.log(`📏 Kích thước gốc của model (${fileName}): X=${size.x.toFixed(2)}, Y=${size.y.toFixed(2)}, Z=${size.z.toFixed(2)}`);

      // Tự động tính toán tỷ lệ Scale đưa về chiều rộng sa bàn chuẩn (~110m)
      const maxHorizontalDim = Math.max(size.x, size.z, 0.001);
      const targetScale = this.targetWidth / maxHorizontalDim;
      model.scale.set(targetScale, targetScale, targetScale);

      // Cập nhật ma trận thế giới sau khi scale
      model.updateMatrixWorld(true);

      // Tính lại Bounding Box sau scale để căn tâm và đặt đáy chạm đất (y = 0)
      const scaledBox = new THREE.Box3().setFromObject(model);
      const scaledCenter = new THREE.Vector3();
      scaledBox.getCenter(scaledCenter);

      // Căn giữa trục X, Z và đặt đáy Y_min đúng chính xác y = 0
      model.position.x = -scaledCenter.x;
      model.position.y = -scaledBox.min.y;
      model.position.z = -scaledCenter.z;

      // Duyệt qua tất cả mesh: Bật castShadow, receiveShadow và tinh chỉnh vật liệu PBR
      let meshCount = 0;
      model.traverse((child) => {
        if (child.isMesh) {
          meshCount++;
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            child.material.side = THREE.DoubleSide; // Chống lật mặt hình học từ AI
            child.material.roughness = child.material.roughness !== undefined ? Math.max(0.3, child.material.roughness) : 0.6;
            child.material.metalness = child.material.metalness !== undefined ? child.material.metalness : 0.1;

            if (child.material.map) {
              child.material.map.encoding = THREE.sRGBEncoding;
              child.material.map.needsUpdate = true;
            }
          }
        }
      });

      // Thêm model vào scene
      scene.add(model);
      this.activeModel = model;
      window.activeGLBModel = model;

      // Tự động ẩn các khối công trình code cũ để không bị chồng lấn đè hình
      this.setProceduralVisibility(false);
      this.proceduralVisible = false;

      // Cập nhật trạng thái HUD
      const statusTag = document.getElementById('glb-status-tag');
      if (statusTag) {
        statusTag.textContent = `Đã nạp (${meshCount} meshes)`;
        statusTag.style.background = '#059669';
        statusTag.style.color = '#ffffff';
      }

      const btnToggle = document.getElementById('btn-toggle-procedural');
      if (btnToggle) {
        btnToggle.textContent = '🏛️ Khối cũ: TẮT';
        btnToggle.style.background = '#334155';
      }

      if (typeof showToast === 'function') {
        showToast(`🎉 Đã nạp thành công mô hình 3D (${fileName})!`);
      }
      if (typeof sounds !== 'undefined' && sounds.playUpgradeFanfare) {
        sounds.playUpgradeFanfare();
      }

      console.log(`✨ Model 3D đã sẵn sàng! Đặt tại Y=0, Scale=${targetScale.toFixed(4)}, Tổng cộng ${meshCount} meshes.`);
    },

    // 7. ẨN / HIỆN CÔNG TRÌNH TĨNH DỰNG BẰNG CODE CŨ TRÁNH ĐÈ HÌNH
    setProceduralVisibility(visible) {
      // Ẩn mặt đất sa bàn cũ
      if (window.groundMesh) window.groundMesh.visible = visible;

      // Ẩn xưởng cưa công nghiệp code cũ
      if (window.industrialSawmill) window.industrialSawmill.visible = visible;

      // Ẩn siêu thị bán lẻ code cũ
      if (window.superMarket) window.superMarket.visible = visible;

      // Ẩn hàng cây rừng thông tĩnh
      if (window.trees && Array.isArray(window.trees)) {
        window.trees.forEach(t => {
          if (t && t.mesh) t.mesh.visible = visible;
        });
      }

      // Ẩn công viên giải trí / vòng đu quay nếu có
      if (window.themeParkGroup) window.themeParkGroup.visible = visible;

      // Ẩn các khối hạ tầng next-gen
      if (window.nextGenInfraGroup) window.nextGenInfraGroup.visible = visible;

      console.log(`[GLBManager] Các khối công trình cũ: ${visible ? 'HIỆN' : 'ẨN'}`);
    }
  };

  window.GLBManager = GLBManager;

  // Tự động kích hoạt khi trang web nạp xong
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GLBManager.init());
  } else {
    // Đợi 500ms để Three.js và World khởi tạo xong
    setTimeout(() => GLBManager.init(), 600);
  }
})();

