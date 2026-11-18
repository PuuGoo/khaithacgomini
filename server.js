/**
 * Lumber & Fishery Empire Tycoon 3D - Node.js Express Backend
 * REST API & WebGL Static Server với kết nối MongoDB Atlas
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');

// Tự động nhận diện node_modules cục bộ và toàn cục trên Windows
if (process.env.APPDATA) {
  module.paths.push(path.join(process.env.APPDATA, 'npm', 'node_modules'));
}

// Nạp biến môi trường từ .env
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (e) {
  console.warn('[!] Không thể nạp .env:', e.message);
}

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const MONGODB_URI = (process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
const DB_NAME = (process.env.DB_NAME || 'lumber_tycoon').trim();
const COLLECTION_NAME = 'game_saves';
const USERS_COLLECTION = 'users';
const CITY_COLLECTION = 'city_state';

// Ẩn mật khẩu khi hiển thị trên màn hình console
const maskedUri = MONGODB_URI.replace(/:([^@/:]+)@/, ':****@');
const isAtlas = MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('mongodb.net');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// -----------------------------------------------------------------------------
// KẾT NỐI MONGODB ATLAS VỚI CƠ CHẾ AUTO-RECONNECT
// -----------------------------------------------------------------------------
let mongoClient = null;
let savesCollection = null;
let usersCollection = null;
let cityCollection = null;

// File backup dự phòng khi mất kết nối mạng
const BACKUP_FILE = path.join(__dirname, 'game_save_backup.json');
const USERS_BACKUP_FILE = path.join(__dirname, 'users_backup.json');
const CITY_BACKUP_FILE = path.join(__dirname, 'city_state_backup.json');

// -----------------------------------------------------------------------------
// TRẠNG THÁI ĐẠI ĐÔ THỊ CHUNG TOÀN SERVER (SHARED CITY STATE)
// -----------------------------------------------------------------------------
let globalCityState = {
  cityLevel: 1,
  cityName: 'Đại Đô Thị Tân Kỷ Nguyên',
  population: 12500,
  treasury: 120000,
  taxRate: 0.08,
  foodReserves: 6200,
  maxFood: 20000,
  powerGridMW: 1200,
  powerDemandMW: 850,
  powerFuel: 180,
  isBlackout: false,
  activeCrisis: null,
  crimeRate: 10,
  ecoIndex: 88,
  currentMayor: 'Ban Quản Trị Lâm Thời',
  mayorCandidates: ['Trần Đại Phú', 'Lê Hào Kiệt', 'Nguyễn Minh Quân'],
  mayorVotes: {},
  wantedPlayers: {},
  policeOfficers: [],
  playerCareers: {},
  cityDecrees: {
    curfew: false,
    reforestation: true,
    freeHealthcare: true,
    taxVAT: 0.08
  },
  marketListings: [
    { id: 'mkt_init_1', sellerId: 'system', sellerName: 'Tổng Kho Vật Tư Đô Thị', item: 'planks', quantity: 50, priceEach: 30, createdAt: Date.now() },
    { id: 'mkt_init_2', sellerId: 'system', sellerName: 'Mỏ Luyện Kim Hoàng Gia', item: 'steel', quantity: 25, priceEach: 85, createdAt: Date.now() },
    { id: 'mkt_init_3', sellerId: 'system', sellerName: 'Trạm Xi Măng Công Nghiệp', item: 'cement', quantity: 30, priceEach: 65, createdAt: Date.now() },
    { id: 'mkt_init_4', sellerId: 'system', sellerName: 'Nông Trường Đồng Xanh', item: 'rations', quantity: 40, priceEach: 22, createdAt: Date.now() }
  ],
  landmarkProject: {
    stage: 1,
    maxStage: 3,
    title: 'Giai Đoạn 1: Móng Trụ Bê Tông & Cốt Thép Ngầm',
    neededPlanks: 60,
    currentPlanks: 0,
    neededSteel: 40,
    currentSteel: 0,
    neededCement: 50,
    currentCement: 0,
    neededMoney: 35000,
    currentMoney: 0,
    topContributors: {}
  }
};

function readCityBackup() {
  try {
    if (fs.existsSync(CITY_BACKUP_FILE)) {
      const data = JSON.parse(fs.readFileSync(CITY_BACKUP_FILE, 'utf8'));
      if (data && data.cityLevel) {
        globalCityState = Object.assign(globalCityState, data);
      }
    }
  } catch (e) {}
}

function writeCityBackup() {
  try {
    fs.writeFileSync(CITY_BACKUP_FILE, JSON.stringify(globalCityState, null, 2), 'utf8');
  } catch (e) {}
}

readCityBackup();

// Mật mã học Native Node.js không phụ thuộc thư viện ngoài
function hashPassword(password, salt = null) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, originalHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

// Đọc / Ghi file người dùng dự phòng cục bộ
function readUsersBackup() {
  try {
    if (fs.existsSync(USERS_BACKUP_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_BACKUP_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function writeUsersBackup(users) {
  try {
    fs.writeFileSync(USERS_BACKUP_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {}
}

// MOCKED IN-MEMORY COLLECTIONS — instant fallback when MongoDB is unconfigured or offline
function createInMemoryCollection(keyField) {
  const store = new Map();
  const applyProjection = (doc, projection) => {
    if (!doc) return null;
    const copy = { ...doc };
    if (projection && projection._id === 0) delete copy._id;
    return copy;
  };
  return {
    createIndex: async () => {},
    findOne: async (query = {}, options = {}) => {
      const key = query[keyField];
      if (key !== undefined) {
        return applyProjection(store.get(key) || null, options.projection);
      }
      for (const doc of store.values()) {
        if (Object.entries(query).every(([k, v]) => doc[k] === v)) {
          return applyProjection(doc, options.projection);
        }
      }
      return null;
    },
    insertOne: async (doc) => {
      const key = doc[keyField] || String(store.size + 1);
      store.set(key, { ...doc });
      return { insertedId: key };
    },
    updateOne: async (query = {}, update = {}, options = {}) => {
      const key = query[keyField];
      let existing = key !== undefined ? store.get(key) : null;
      if (!existing && !options.upsert) return { matchedCount: 0, modifiedCount: 0 };
      const next = { ...(existing || {}), ...query, ...(update.$set || {}) };
      const saveKey = next[keyField] || key;
      store.set(saveKey, next);
      return { matchedCount: existing ? 1 : 0, modifiedCount: 1 };
    },
    find: (query = {}, options = {}) => {
      let results = Array.from(store.values())
        .filter((doc) => Object.entries(query).every(([k, v]) => doc[k] === v))
        .map((doc) => applyProjection(doc, options.projection));
      const cursor = {
        sort: (sortObj = {}) => {
          results.sort((a, b) => {
            for (const [field, dir] of Object.entries(sortObj)) {
              const diff = ((a[field] || 0) - (b[field] || 0)) * dir;
              if (diff !== 0) return diff;
            }
            return 0;
          });
          return cursor;
        },
        limit: (n) => {
          results = results.slice(0, n);
          return cursor;
        },
        toArray: async () => results
      };
      return cursor;
    }
  };
}

const mockSavesCollection = createInMemoryCollection('playerId');
const mockUsersCollection = createInMemoryCollection('username');
const mockCityCollection = createInMemoryCollection('_id');

// Seed in-memory users from local backup if available
for (const u of readUsersBackup()) {
  if (u && u.username) mockUsersCollection.insertOne(u).catch(() => {});
}

let mongoDisabled = !MONGODB_URI;

async function connectMongoDB() {
  if (!MONGODB_URI || mongoDisabled) {
    savesCollection = mockSavesCollection;
    usersCollection = mockUsersCollection;
    cityCollection = mockCityCollection;
    return { savesCollection, usersCollection, cityCollection };
  }

  try {
    const timeout = 2500;
    mongoClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: timeout,
      connectTimeoutMS: timeout,
      retryWrites: true
    });

    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    savesCollection = db.collection(COLLECTION_NAME);
    await savesCollection.createIndex({ playerId: 1 }, { unique: true });

    usersCollection = db.collection(USERS_COLLECTION);
    await usersCollection.createIndex({ username: 1 }, { unique: true });

    cityCollection = db.collection(CITY_COLLECTION);
    try {
      const savedCity = await cityCollection.findOne({ _id: 'global_city' });
      if (savedCity && savedCity.data) {
        globalCityState = Object.assign(globalCityState, savedCity.data);
      }
    } catch (e) {}

    const clusterType = isAtlas ? 'MongoDB Atlas (Cloud)' : 'MongoDB Cục Bộ (Local)';
    console.log(`[+] Kết nối ${clusterType} thành công!`);
    return { savesCollection, usersCollection, cityCollection };
  } catch (err) {
    console.warn(`[!] MongoDB not connected (${err.message}) — using in-memory store`);
    mongoDisabled = true;
    savesCollection = mockSavesCollection;
    usersCollection = mockUsersCollection;
    cityCollection = mockCityCollection;
    return { savesCollection, usersCollection, cityCollection };
  }
}

// Khởi tạo kết nối ban đầu (không block khởi động)
connectMongoDB().catch(() => {});

async function getCollection() {
  if (mongoDisabled || !MONGODB_URI) return mockSavesCollection;
  if (savesCollection && mongoClient) {
    try {
      await mongoClient.db('admin').command({ ping: 1 });
      return savesCollection;
    } catch (e) {
      console.log('[!] Socket MongoDB gián đoạn, chuyển sang bộ nhớ tạm...');
    }
  }
  const res = await connectMongoDB();
  return res ? res.savesCollection : mockSavesCollection;
}

async function getUsersCollection() {
  if (mongoDisabled || !MONGODB_URI) return mockUsersCollection;
  if (usersCollection && mongoClient) {
    try {
      await mongoClient.db('admin').command({ ping: 1 });
      return usersCollection;
    } catch (e) {
      console.log('[!] Socket MongoDB gián đoạn, chuyển sang bộ nhớ tạm...');
    }
  }
  const res = await connectMongoDB();
  return res ? res.usersCollection : mockUsersCollection;
}

// -----------------------------------------------------------------------------
// REST API: HỆ THỐNG TÀI KHOẢN & ĐĂNG NHẬP / ĐĂNG KÝ (AUTH)
// -----------------------------------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    let { username, password, empireName } = req.body || {};
    username = String(username || '').trim().toLowerCase();
    password = String(password || '');
    empireName = String(empireName || '').trim() || `Đế Chế Của ${username.toUpperCase()}`;

    if (!username || username.length < 3) {
      return res.status(400).json({ status: 'error', message: 'Tên đăng nhập tối thiểu 3 ký tự!' });
    }
    if (!password || password.length < 3) {
      return res.status(400).json({ status: 'error', message: 'Mật khẩu tối thiểu 3 ký tự!' });
    }

    const { salt, hash } = hashPassword(password);
    const token = crypto.randomBytes(24).toString('hex');
    const now = new Date().toISOString();

    const newUser = {
      username,
      empireName,
      salt,
      passwordHash: hash,
      token,
      createdAt: now,
      lastLoginAt: now
    };

    // Kiểm tra trùng username trong Atlas
    const usersCol = await getUsersCollection();
    if (usersCol) {
      const existing = await usersCol.findOne({ username });
      if (existing) {
        return res.status(400).json({ status: 'error', message: 'Tên tài khoản này đã có người đăng ký!' });
      }
      await usersCol.insertOne(newUser);
    } else {
      // Fallback file cục bộ
      const backupUsers = readUsersBackup();
      if (backupUsers.find(u => u.username === username)) {
        return res.status(400).json({ status: 'error', message: 'Tên tài khoản này đã có người đăng ký!' });
      }
      backupUsers.push(newUser);
      writeUsersBackup(backupUsers);
    }

    // Khởi tạo đế chế mới sạch sẽ cho tài khoản này
    const initialEmpireData = {
      playerId: username,
      username: username,
      empireName: empireName,
      level: 1,
      money: 100.0, // Tặng quà khởi nghiệp $100
      gems: 0,
      logs: 0,
      planks: 0,
      freshFish: 0,
      cannedFish: 0,
      backpackTier: 1,
      axeTier: 1,
      unlockedZones: [1],
      buildingStages: {},
      totalLogsCut: 0,
      totalPlanksSawn: 0,
      exportOrders: 0,
      updatedAt: now
    };

    const savesCol = await getCollection();
    if (savesCol) {
      await savesCol.updateOne({ playerId: username }, { $set: initialEmpireData }, { upsert: true });
    }

    console.log(`[+] Đăng ký tài khoản thành công: ${username} - Đế Chế: "${empireName}"`);
    return res.json({
      status: 'success',
      message: 'Đăng ký tài khoản thành công! Chào mừng tới đế chế của bạn.',
      user: {
        username,
        empireName,
        token
      },
      empireData: initialEmpireData
    });
  } catch (err) {
    console.error('[!] Lỗi đăng ký:', err);
    return res.status(500).json({ status: 'error', message: 'Lỗi máy chủ khi đăng ký: ' + err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    let { username, password } = req.body || {};
    username = String(username || '').trim().toLowerCase();
    password = String(password || '');

    if (!username || !password) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!' });
    }

    let user = null;
    const usersCol = await getUsersCollection();
    if (usersCol) {
      user = await usersCol.findOne({ username });
    } else {
      const backupUsers = readUsersBackup();
      user = backupUsers.find(u => u.username === username);
    }

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Tài khoản không tồn tại! Vui lòng đăng ký mới.' });
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ status: 'error', message: 'Mật khẩu không chính xác!' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const now = new Date().toISOString();

    if (usersCol) {
      await usersCol.updateOne({ username }, { $set: { token, lastLoginAt: now } });
    }

    // Tải dữ liệu đế chế của người chơi
    let empireData = null;
    const savesCol = await getCollection();
    if (savesCol) {
      empireData = await savesCol.findOne({ playerId: username }, { projection: { _id: 0 } });
    }

    console.log(`[+] Đăng nhập thành công: ${username} - Đế Chế: "${user.empireName}"`);
    return res.json({
      status: 'success',
      message: `Chào mừng Chủ tịch ${username} trở lại!`,
      user: {
        username: user.username,
        empireName: user.empireName || `Đế Chế Của ${username.toUpperCase()}`,
        token
      },
      empireData: empireData || null
    });
  } catch (err) {
    console.error('[!] Lỗi đăng nhập:', err);
    return res.status(500).json({ status: 'error', message: 'Lỗi máy chủ: ' + err.message });
  }
});

// Cập nhật tên Đế Chế
app.post('/api/auth/rename-empire', async (req, res) => {
  try {
    let { username, empireName } = req.body || {};
    username = String(username || '').trim().toLowerCase();
    empireName = String(empireName || '').trim();

    if (!username || !empireName) {
      return res.status(400).json({ status: 'error', message: 'Tên đế chế không được để trống!' });
    }

    const usersCol = await getUsersCollection();
    if (usersCol) {
      await usersCol.updateOne({ username }, { $set: { empireName } });
    }
    const savesCol = await getCollection();
    if (savesCol) {
      await savesCol.updateOne({ playerId: username }, { $set: { empireName } });
    }

    return res.json({ status: 'success', message: 'Đã đổi tên đế chế thành công!', empireName });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: e.message });
  }
});

// Bảng xếp hạng và danh sách Đế Chế bạn bè
app.get('/api/empires/leaderboard', async (req, res) => {
  try {
    const list = [];
    const savesCol = await getCollection();
    if (savesCol) {
      const docs = await savesCol.find(
        {},
        {
          projection: {
            playerId: 1,
            username: 1,
            empireName: 1,
            level: 1,
            money: 1,
            totalLogsCut: 1,
            vipLevel: 1,
            prestigeLevel: 1,
            yachtTier: 1,
            unlockedBadgesCount: 1,
            timberportState: 1,
            updatedAt: 1
          }
        }
      )
        .sort({ prestigeLevel: -1, level: -1, money: -1 })
        .limit(30)
        .toArray();

      for (const d of docs) {
        const ts = d.timberportState || {};
        list.push({
          username: d.username || d.playerId,
          empireName: d.empireName || `Đế Chế ${d.playerId}`,
          level: d.level || ts.level || 1,
          money: Math.round(d.money || ts.cash || 0),
          totalLogsCut: d.totalLogsCut || ts.totalLogsCut || 0,
          vipLevel: d.vipLevel ?? ts.vipLevel ?? 0,
          prestigeLevel: d.prestigeLevel ?? ts.prestigeLevel ?? 0,
          yachtTier: d.yachtTier ?? ts.yachtTier ?? 0,
          unlockedBadgesCount: d.unlockedBadgesCount ?? (Array.isArray(ts.unlockedBadges) ? ts.unlockedBadges.length : 0),
          updatedAt: d.updatedAt || ''
        });
      }
    }
    return res.json({ status: 'success', empires: list });
  } catch (e) {
    return res.json({ status: 'success', empires: [] });
  }
});

// Xem dữ liệu đế chế của người chơi khác (Tham quan đế chế)
app.get('/api/empires/view/:username', async (req, res) => {
  try {
    const target = req.params.username.trim().toLowerCase();
    const savesCol = await getCollection();
    if (savesCol) {
      const doc = await savesCol.findOne({ playerId: target }, { projection: { _id: 0 } });
      if (doc) {
        return res.json({ status: 'success', found: true, empire: doc });
      }
    }
    return res.status(404).json({ status: 'error', message: 'Không tìm thấy đế chế này!' });
  } catch (e) {
    return res.status(500).json({ status: 'error', message: e.message });
  }
});

// -----------------------------------------------------------------------------
// REST API ENDPOINTS (SAVE / LOAD)
// -----------------------------------------------------------------------------
app.post('/api/save-game', async (req, res) => {
  const data = req.body || {};
  const playerId = data.playerId || 'player_01';
  const now = new Date().toISOString();
  data.playerId = playerId;
  data.updatedAt = now;
  data.lastSavedAt = now;

  try {
    const col = await getCollection();
    if (col) {
      await col.updateOne(
        { playerId },
        { $set: data },
        { upsert: true }
      );
      return res.json({
        status: 'success',
        storage: 'atlas',
        message: 'Đã lưu vào MongoDB Atlas thành công!',
        data
      });
    }
  } catch (err) {
    console.warn(`[!] Lỗi ghi Atlas (${err.message}), chuyển sang lưu tệp dự phòng...`);
  }

  // Fallback ghi file backup cục bộ
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf8');
    return res.json({
      status: 'success',
      storage: 'backup_file',
      message: 'Đã lưu vào tệp dự phòng cục bộ!',
      data
    });
  } catch (e) {
    return res.json({
      status: 'partial',
      storage: 'memory',
      message: 'Đã lưu bộ nhớ tạm!',
      data
    });
  }
});

app.get('/api/load-game/:playerId', async (req, res) => {
  const playerId = req.params.playerId || 'player_01';

  try {
    const col = await getCollection();
    if (col) {
      let doc = await col.findOne({ playerId }, { projection: { _id: 0 } });
      if (!doc && playerId === 'player_main') {
        doc = await col.findOne({ playerId: 'player_01' }, { projection: { _id: 0 } });
      }
      if (doc) {
        return res.json({
          status: 'success',
          found: true,
          storage: 'atlas',
          message: 'Đã tải dữ liệu game từ MongoDB Atlas!',
          data: doc
        });
      }
    }
  } catch (err) {
    console.warn(`[!] Lỗi đọc Atlas: ${err.message}`);
  }

  // Fallback đọc file backup
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
      const doc = JSON.parse(raw);
      return res.json({
        status: 'success',
        found: true,
        storage: 'backup_file',
        message: 'Đã tải từ tệp lưu cục bộ!',
        data: doc
      });
    } catch (e) {}
  }

  // Khởi tạo mặc định nếu chưa có
  return res.json({
    status: 'success',
    found: false,
    storage: 'default',
    message: 'Chưa có bản lưu, khởi tạo mới!',
    data: {
      playerId,
      level: 1,
      money: 0,
      gems: 0,
      logs: 0,
      planks: 0,
      freshFish: 0,
      cannedFish: 0,
      forklifts: 0,
      boats: 0,
      unlockedZones: [1],
      buildingStages: {},
      totalLogsCut: 0,
      totalPlanksSawn: 0,
      exportOrders: 0
    }
  });
});

// -----------------------------------------------------------------------------
// REST API CHO ĐẠI ĐÔ THỊ ĐẾ CHẾ (SHARED METROPOLIS CITY STATE API)
// -----------------------------------------------------------------------------
app.get('/api/city-state', (req, res) => {
  res.json({
    status: 'success',
    data: globalCityState
  });
});

app.post('/api/city-state/contribute', (req, res) => {
  const { nickname, planks = 0, steel = 0, cement = 0, money = 0 } = req.body;
  const proj = globalCityState.landmarkProject;

  const pAdd = Math.min(planks, proj.neededPlanks - proj.currentPlanks);
  const sAdd = Math.min(steel, proj.neededSteel - proj.currentSteel);
  const cAdd = Math.min(cement, proj.neededCement - proj.currentCement);
  const mAdd = Math.min(money, proj.neededMoney - proj.currentMoney);

  proj.currentPlanks += pAdd;
  proj.currentSteel += sAdd;
  proj.currentCement += cAdd;
  proj.currentMoney += mAdd;

  const nick = String(nickname || 'Vô danh').slice(0, 24);
  const pts = pAdd * 10 + sAdd * 25 + cAdd * 20 + Math.floor(mAdd / 500);
  proj.topContributors[nick] = (proj.topContributors[nick] || 0) + pts;

  // Kiểm tra hoàn thành giai đoạn
  let stageCompleted = false;
  if (proj.currentPlanks >= proj.neededPlanks &&
      proj.currentSteel >= proj.neededSteel &&
      proj.currentCement >= proj.neededCement &&
      proj.currentMoney >= proj.neededMoney) {
    if (proj.stage < proj.maxStage) {
      proj.stage++;
      stageCompleted = true;
      if (proj.stage === 2) {
        proj.title = 'Giai Đoạn 2: Khung Thép Siêu Cường & Giàn Giáo Lõi Cao 45m';
        proj.neededPlanks = 100;
        proj.neededSteel = 80;
        proj.neededCement = 90;
        proj.neededMoney = 75000;
      } else if (proj.stage === 3) {
        proj.title = 'Giai Đoạn 3: Chóp Vòm Kính Hoàng Gia & Đỉnh Tháp Ánh Sáng 90m';
        proj.neededPlanks = 150;
        proj.neededSteel = 140;
        proj.neededCement = 120;
        proj.neededMoney = 150000;
      }
      proj.currentPlanks = 0;
      proj.currentSteel = 0;
      proj.currentCement = 0;
      proj.currentMoney = 0;
      globalCityState.cityLevel++;
      globalCityState.population += 3500;
    }
  }

  writeCityBackup();
  broadcastCityState();

  res.json({
    status: 'success',
    stageCompleted,
    data: globalCityState
  });
});

app.post('/api/city-state/pay-tax', (req, res) => {
  const amount = Math.max(0, parseInt(req.body.amount, 10) || 0);
  globalCityState.treasury += amount;
  res.json({ status: 'success', treasury: globalCityState.treasury });
});

app.post('/api/city-state/deposit-food', (req, res) => {
  const amount = Math.max(0, parseInt(req.body.amount, 10) || 0);
  globalCityState.foodReserves = Math.min(globalCityState.maxFood, globalCityState.foodReserves + amount);
  broadcastCityState();
  res.json({ status: 'success', foodReserves: globalCityState.foodReserves });
});

// -----------------------------------------------------------------------------
// PHỤC VỤ FILE TĨNH GIAO DIỆN (STATIC FILES)
// -----------------------------------------------------------------------------
const publicDir = path.join(__dirname, 'public');
const staticOptions = {
  etag: false,
  maxAge: 0,
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (filePath && filePath.endsWith('.glb')) {
      res.setHeader('Content-Type', 'model/gltf-binary');
    } else if (filePath && filePath.endsWith('.gltf')) {
      res.setHeader('Content-Type', 'model/gltf+json');
    }
  }
};
app.use('/vendor/three', express.static(path.join(__dirname, 'node_modules', 'three'), staticOptions));
app.use(express.static(publicDir, staticOptions));
// Phục vụ thêm root directory để tương thích với vendor và file cũ
app.use(express.static(__dirname, staticOptions));

// Express error middleware fallback for offline database errors
app.use((err, req, res, next) => {
  if (err && (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || (err.message && err.message.includes('buffering timed out')))) {
    console.warn('[AI Studio] Database offline — returning mock empty response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }
  next(err);
});

// -----------------------------------------------------------------------------
// WEBSOCKET REAL-TIME MULTIPLAYER SYSTEM (ZERO-DEPENDENCY RFC 6455)
// -----------------------------------------------------------------------------
function encodeWSFrame(data) {
  const payload = Buffer.from(data, 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = len;
  } else if (len <= 0xFFFF) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function decodeWSFrame(buffer) {
  if (buffer.length < 2) return null;
  const opcode = buffer[0] & 0x0F;
  if (opcode === 8) return { type: 'close' };
  if (opcode === 9) return { type: 'ping' };
  if (opcode === 10) return { type: 'pong' };

  const isMasked = (buffer[1] & 0x80) !== 0;
  let payloadLen = buffer[1] & 0x7F;
  let offset = 2;

  if (payloadLen === 126) {
    if (buffer.length < offset + 2) return null;
    payloadLen = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (payloadLen === 127) {
    if (buffer.length < offset + 8) return null;
    payloadLen = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
  }

  let maskKey = null;
  if (isMasked) {
    if (buffer.length < offset + 4) return null;
    maskKey = buffer.subarray(offset, offset + 4);
    offset += 4;
  }

  if (buffer.length < offset + payloadLen) return null;
  const payload = Buffer.alloc(payloadLen);
  buffer.copy(payload, 0, offset, offset + payloadLen);

  if (isMasked && maskKey) {
    for (let i = 0; i < payloadLen; i++) {
      payload[i] ^= maskKey[i % 4];
    }
  }

  return {
    type: 'text',
    data: payload.toString('utf8'),
    bytesRead: offset + payloadLen
  };
}

const onlinePlayers = new Map();

function broadcast(msgObj, excludeId = null) {
  const frame = encodeWSFrame(JSON.stringify(msgObj));
  for (const [id, player] of onlinePlayers.entries()) {
    if (id !== excludeId && player.socket && !player.socket.destroyed) {
      try { player.socket.write(frame); } catch (e) {}
    }
  }
}

function broadcastCityState() {
  broadcast({
    type: 'city_state_sync',
    cityState: globalCityState
  });
}

server.on('upgrade', (req, socket, head) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }
  const digest = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\n' +
               'Upgrade: websocket\r\n' +
               'Connection: Upgrade\r\n' +
               'Sec-WebSocket-Accept: ' + digest + '\r\n\r\n');

  const playerId = 'p_' + Math.random().toString(36).substring(2, 8);
  let playerRecord = {
    id: playerId,
    nickname: 'Thợ Rừng #' + Math.floor(Math.random() * 899 + 100),
    skin: 'default',
    level: 1,
    x: 0, y: 0, z: -18,
    rotY: 0,
    isMoving: false,
    isChopping: false,
    isSwimming: false,
    vehicle: null,
    socket: socket
  };
  onlinePlayers.set(playerId, playerRecord);

  let bufferAcc = Buffer.alloc(0);

  socket.on('data', (chunk) => {
    bufferAcc = Buffer.concat([bufferAcc, chunk]);
    while (bufferAcc.length > 0) {
      const parsed = decodeWSFrame(bufferAcc);
      if (!parsed) break;
      bufferAcc = bufferAcc.subarray(parsed.bytesRead || bufferAcc.length);

      if (parsed.type === 'close') {
        socket.destroy();
        break;
      }
      if (parsed.type === 'ping') {
        socket.write(Buffer.from([0x8A, 0x00]));
        continue;
      }
      if (parsed.type === 'text') {
        try {
          const msg = JSON.parse(parsed.data);
          handleClientMessage(playerId, msg);
        } catch (e) {}
      }
    }
  });

  const cleanup = () => {
    if (onlinePlayers.has(playerId)) {
      onlinePlayers.delete(playerId);
      broadcast({ type: 'player_leave', id: playerId });
      console.log(`[-] Người chơi ${playerId} đã rời phòng. Còn ${onlinePlayers.size} người chơi.`);
    }
  };

  socket.on('close', cleanup);
  socket.on('end', cleanup);
  socket.on('error', cleanup);
});

function handleClientMessage(senderId, msg) {
  const p = onlinePlayers.get(senderId);
  if (!p) return;

  switch (msg.type) {
    case 'join': {
      if (msg.nickname) p.nickname = String(msg.nickname).slice(0, 24);
      p.empireName = String(msg.empireName || ('Đế Chế ' + p.nickname)).slice(0, 32);
      if (msg.skin) p.skin = msg.skin;
      if (msg.level) p.level = msg.level;
      if (msg.x !== undefined) p.x = msg.x;
      if (msg.z !== undefined) p.z = msg.z;

      const list = [];
      for (const [id, other] of onlinePlayers.entries()) {
        list.push({
          id: other.id,
          nickname: other.nickname,
          empireName: other.empireName || ('Đế Chế ' + other.nickname),
          skin: other.skin,
          level: other.level,
          x: other.x, y: other.y, z: other.z,
          rotY: other.rotY,
          isMoving: other.isMoving,
          isChopping: other.isChopping,
          isSwimming: other.isSwimming,
          vehicle: other.vehicle
        });
      }

      const frame = encodeWSFrame(JSON.stringify({
        type: 'init',
        yourId: senderId,
        players: list
      }));
      try { p.socket.write(frame); } catch (e) {}

      // Đồng bộ ngay lập tức Trạng thái Đại Đô Thị thời gian thực cho người chơi mới
      const frameCity = encodeWSFrame(JSON.stringify({
        type: 'city_state_sync',
        cityState: globalCityState
      }));
      try { p.socket.write(frameCity); } catch (e) {}

      broadcast({
        type: 'player_join',
        player: {
          id: p.id,
          nickname: p.nickname,
          empireName: p.empireName,
          skin: p.skin,
          level: p.level,
          x: p.x, y: p.y, z: p.z,
          rotY: p.rotY,
          vehicle: p.vehicle
        }
      }, senderId);

      console.log(`[+] Người chơi ${p.nickname} [${p.empireName}] (${senderId}) đã tham gia thế giới 3D! Tổng: ${onlinePlayers.size}`);
      break;
    }

    case 'move': {
      p.x = msg.x;
      p.y = msg.y;
      p.z = msg.z;
      p.rotY = msg.rotY;
      p.isMoving = msg.isMoving;
      p.isChopping = msg.isChopping;
      p.isSwimming = msg.isSwimming;
      p.vehicle = msg.vehicle;

      broadcast({
        type: 'player_move',
        id: senderId,
        x: msg.x, y: msg.y, z: msg.z,
        rotY: msg.rotY,
        isMoving: msg.isMoving,
        isChopping: msg.isChopping,
        isSwimming: msg.isSwimming,
        vehicle: msg.vehicle
      }, senderId);
      break;
    }

    case 'chat': {
      const text = String(msg.text || '').trim().slice(0, 100);
      if (text.length > 0) {
        broadcast({
          type: 'player_chat',
          id: senderId,
          nickname: p.nickname,
          empireName: p.empireName,
          text: text,
          time: Date.now()
        });
      }
      break;
    }

    case 'emote': {
      broadcast({
        type: 'player_emote',
        id: senderId,
        emote: msg.emote
      });
      break;
    }

    case 'chop': {
      broadcast({
        type: 'player_chop',
        id: senderId,
        x: msg.x, z: msg.z
      }, senderId);
      break;
    }

    // -------------------------------------------------------------------------
    // HỆ THỐNG ĐẠI ĐÔ THỊ, PHÁP LUẬT & TỘI PHẠM (CITY STATE & JUSTICE WEBSOCKETS)
    // -------------------------------------------------------------------------
    case 'city_get_state': {
      const frameCity = encodeWSFrame(JSON.stringify({
        type: 'city_state_sync',
        cityState: globalCityState
      }));
      try { p.socket.write(frameCity); } catch (e) {}
      break;
    }

    case 'city_contribute': {
      const proj = globalCityState.landmarkProject;
      const { planks = 0, steel = 0, cement = 0, money = 0 } = msg;

      const pAdd = Math.min(planks, proj.neededPlanks - proj.currentPlanks);
      const sAdd = Math.min(steel, proj.neededSteel - proj.currentSteel);
      const cAdd = Math.min(cement, proj.neededCement - proj.currentCement);
      const mAdd = Math.min(money, proj.neededMoney - proj.currentMoney);

      proj.currentPlanks += pAdd;
      proj.currentSteel += sAdd;
      proj.currentCement += cAdd;
      proj.currentMoney += mAdd;

      const nick = p.nickname;
      const pts = pAdd * 10 + sAdd * 25 + cAdd * 20 + Math.floor(mAdd / 500);
      proj.topContributors[nick] = (proj.topContributors[nick] || 0) + pts;

      let stageCompleted = false;
      if (proj.currentPlanks >= proj.neededPlanks &&
          proj.currentSteel >= proj.neededSteel &&
          proj.currentCement >= proj.neededCement &&
          proj.currentMoney >= proj.neededMoney) {
        if (proj.stage < proj.maxStage) {
          proj.stage++;
          stageCompleted = true;
          if (proj.stage === 2) {
            proj.title = 'Giai Đoạn 2: Khung Thép Siêu Cường & Giàn Giáo Lõi Cao 45m';
            proj.neededPlanks = 100;
            proj.neededSteel = 80;
            proj.neededCement = 90;
            proj.neededMoney = 75000;
          } else if (proj.stage === 3) {
            proj.title = 'Giai Đoạn 3: Chóp Vòm Kính Hoàng Gia & Đỉnh Tháp Ánh Sáng 90m';
            proj.neededPlanks = 150;
            proj.neededSteel = 140;
            proj.neededCement = 120;
            proj.neededMoney = 150000;
          }
          proj.currentPlanks = 0;
          proj.currentSteel = 0;
          proj.currentCement = 0;
          proj.currentMoney = 0;
          globalCityState.cityLevel++;
          globalCityState.population += 3500;
        }
      }

      writeCityBackup();
      broadcastCityState();

      broadcast({
        type: 'city_announcement',
        announcement: stageCompleted
          ? `🎉 ĐẠI CÔNG TRÌNH THÀNH PHỐ: Hoàn thành Giai đoạn! Mở khóa: ${proj.title}!`
          : `🏗️ ${p.nickname} vừa đóng góp vật tư xây dựng Siêu Tháp Thế Kỷ (+${pts} Điểm)!`
      });
      break;
    }

    case 'crime_commit': {
      const stars = Math.min(5, Math.max(1, parseInt(msg.stars, 10) || 1));
      const crimeType = String(msg.crimeType || 'Trộm cắp tài sản').slice(0, 50);
      const bounty = stars * 650;

      globalCityState.wantedPlayers[senderId] = {
        id: senderId,
        nickname: p.nickname,
        stars: stars,
        bounty: bounty,
        crimeType: crimeType,
        time: Date.now()
      };

      globalCityState.crimeRate = Math.min(100, globalCityState.crimeRate + stars * 4);
      writeCityBackup();
      broadcastCityState();

      broadcast({
        type: 'crime_alert',
        criminalId: senderId,
        nickname: p.nickname,
        stars: stars,
        bounty: bounty,
        crimeType: crimeType
      });
      break;
    }

    case 'police_arrest': {
      const targetId = msg.targetId;
      const targetWanted = globalCityState.wantedPlayers[targetId];
      if (targetWanted) {
        const reward = targetWanted.bounty || 1200;
        delete globalCityState.wantedPlayers[targetId];
        globalCityState.crimeRate = Math.max(5, globalCityState.crimeRate - 8);
        writeCityBackup();
        broadcastCityState();

        broadcast({
          type: 'police_arrest_broadcast',
          policeId: senderId,
          policeName: p.nickname,
          targetId: targetId,
          targetName: targetWanted.nickname,
          bounty: reward
        });
      }
      break;
    }

    case 'prison_release': {
      delete globalCityState.wantedPlayers[senderId];
      writeCityBackup();
      broadcastCityState();
      break;
    }

    case 'career_select': {
      const career = String(msg.career || 'citizen');
      globalCityState.playerCareers = globalCityState.playerCareers || {};
      globalCityState.playerCareers[senderId] = career;
      writeCityBackup();
      broadcastCityState();
      broadcast({
        type: 'city_announcement',
        announcement: `💼 CÔNG DÂN ${p.nickname} ĐÃ NHẬN NGHỀ MỚI: ${career.toUpperCase()}!`
      });
      break;
    }

    case 'power_feed_fuel': {
      const fuel = Math.max(1, parseInt(msg.fuelCount, 10) || 10);
      globalCityState.powerFuel = Math.min(600, (globalCityState.powerFuel || 0) + fuel);
      const wasBlackout = globalCityState.isBlackout;
      if (globalCityState.powerFuel > 20) {
        globalCityState.isBlackout = false;
        globalCityState.powerGridMW = 1200;
      }
      writeCityBackup();
      broadcastCityState();
      if (wasBlackout && !globalCityState.isBlackout) {
        broadcast({
          type: 'city_announcement',
          announcement: `⚡ LƯỚI ĐIỆN ĐÔ THỊ ĐÃ ĐƯỢC PHỤC HỒI! Cảm ơn ${p.nickname} đã nạp nhiên liệu!`
        });
      }
      break;
    }

    case 'city_decree_update': {
      const { decreeKey, value } = msg;
      if (decreeKey && globalCityState.cityDecrees) {
        globalCityState.cityDecrees[decreeKey] = value;
        writeCityBackup();
        broadcastCityState();
        broadcast({
          type: 'city_announcement',
          announcement: `🏛️ THỊ TRƯỞNG BAN HÀNH QUY ĐỊNH MỚI: [${decreeKey}] = ${value}!`
        });
      }
      break;
    }

    case 'market_list_item': {
      const { item, quantity = 1, priceEach = 10 } = msg;
      const listing = {
        id: 'mkt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        sellerId: senderId,
        sellerName: p.nickname,
        item: item,
        quantity: Math.max(1, parseInt(quantity, 10)),
        priceEach: Math.max(1, parseInt(priceEach, 10)),
        createdAt: Date.now()
      };
      globalCityState.marketListings = globalCityState.marketListings || [];
      globalCityState.marketListings.unshift(listing);
      if (globalCityState.marketListings.length > 50) globalCityState.marketListings.pop();
      writeCityBackup();
      broadcastCityState();
      broadcast({
        type: 'market_update',
        announcement: `📦 SÀN GIAO DỊCH: ${p.nickname} vừa đăng bán ${quantity} ${item} giá $${priceEach}/cái!`
      });
      break;
    }

    case 'market_buy_item': {
      const { listingId } = msg;
      globalCityState.marketListings = globalCityState.marketListings || [];
      const idx = globalCityState.marketListings.findIndex(l => l.id === listingId);
      if (idx !== -1) {
        const itemBought = globalCityState.marketListings[idx];
        globalCityState.marketListings.splice(idx, 1);
        writeCityBackup();
        broadcastCityState();
        broadcast({
          type: 'market_item_bought',
          buyerId: senderId,
          buyerName: p.nickname,
          listingId: listingId,
          item: itemBought.item,
          quantity: itemBought.quantity,
          totalPrice: itemBought.quantity * itemBought.priceEach
        });
      }
      break;
    }

    case 'crisis_extinguish': {
      if (globalCityState.activeCrisis) {
        const dmg = Math.max(5, parseInt(msg.damage, 10) || 15);
        globalCityState.activeCrisis.hp -= dmg;
        if (globalCityState.activeCrisis.hp <= 0) {
          const rewardMoney = globalCityState.activeCrisis.rewardMoney || 3500;
          const rewardGems = globalCityState.activeCrisis.rewardGems || 15;
          const crisisTitle = globalCityState.activeCrisis.title;
          globalCityState.activeCrisis = null;
          globalCityState.ecoIndex = Math.min(100, (globalCityState.ecoIndex || 85) + 6);
          writeCityBackup();
          broadcastCityState();
          broadcast({
            type: 'crisis_resolved',
            heroId: senderId,
            heroName: p.nickname,
            crisisTitle: crisisTitle,
            rewardMoney: rewardMoney,
            rewardGems: rewardGems,
            announcement: `🏆 ANH HÙNG CỨU HỎA: ${p.nickname} đã dập tắt thành công đám cháy [${crisisTitle}]! Thưởng $${rewardMoney} USD & ${rewardGems} Gems!`
          });
        } else {
          broadcastCityState();
        }
      }
      break;
    }

    case 'underworld_heist': {
      const stolenMoney = Math.floor(Math.random() * 800 + 400);
      globalCityState.treasury = Math.max(10000, globalCityState.treasury - stolenMoney);
      globalCityState.wantedPlayers = globalCityState.wantedPlayers || {};
      const currentStars = (globalCityState.wantedPlayers[senderId] ? globalCityState.wantedPlayers[senderId].stars : 0) + 2;
      globalCityState.wantedPlayers[senderId] = {
        id: senderId,
        nickname: p.nickname,
        stars: Math.min(5, currentStars),
        bounty: 1500 + currentStars * 500,
        crimeType: 'Cướp ngân quỹ / Bẻ khóa trộm xe'
      };
      globalCityState.crimeRate = Math.min(100, (globalCityState.crimeRate || 10) + 8);
      writeCityBackup();
      broadcastCityState();
      broadcast({
        type: 'crime_alert',
        criminalId: senderId,
        nickname: p.nickname,
        crimeType: 'Đạo tặc bẻ khóa cướp ngân quỹ đô thị!',
        stars: currentStars,
        bounty: 1500 + currentStars * 500
      });
      break;
    }

    case 'mayor_vote': {
      const cand = String(msg.candidate || '').trim();
      if (cand) {
        globalCityState.mayorVotes[cand] = (globalCityState.mayorVotes[cand] || 0) + 1;
        // Kiểm tra ai nhiều phiếu nhất
        let maxV = -1, win = globalCityState.currentMayor;
        for (const [c, v] of Object.entries(globalCityState.mayorVotes)) {
          if (v > maxV) { maxV = v; win = c; }
        }
        globalCityState.currentMayor = win;
        writeCityBackup();
        broadcastCityState();
      }
      break;
    }
  }
}

// -----------------------------------------------------------------------------
// CHU KỲ MÔ PHỎNG ĐẠI ĐÔ THỊ THỜI GIAN THỰC (CITY VITAL SIGNS SIMULATION - 10S)
// -----------------------------------------------------------------------------
setInterval(() => {
  if (onlinePlayers.size === 0) return;

  // 1. Tiêu thụ lương thực đô thị
  if (globalCityState.foodReserves > 0) {
    globalCityState.foodReserves = Math.max(0, globalCityState.foodReserves - 3);
    if (globalCityState.foodReserves > 400) {
      globalCityState.population += Math.floor(Math.random() * 4 + 1);
    }
  } else {
    globalCityState.population = Math.max(1000, globalCityState.population - Math.floor(Math.random() * 6 + 2));
  }

  // 2. Tiêu hao nhiên liệu lò nhiệt điện đô thị & Khủng hoảng mất điện (Blackout)
  globalCityState.powerFuel = Math.max(0, (globalCityState.powerFuel || 180) - 2);
  if (globalCityState.powerFuel <= 0) {
    if (!globalCityState.isBlackout) {
      globalCityState.isBlackout = true;
      globalCityState.powerGridMW = 180;
      broadcast({
        type: 'city_announcement',
        announcement: '⚠️ KHẨN CẤP: Lò nhiệt điện cạn kiệt nhiên liệu! THÀNH PHỐ BỊ MẤT ĐIỆN DIỆN RỘNG (BLACKOUT)!'
      });
    }
  } else {
    globalCityState.isBlackout = false;
    globalCityState.powerGridMW = 1200;
  }

  // 3. Quản lý Sự cố Hỏa hoạn & Cứu nạn 911 Ngẫu nhiên
  if (globalCityState.activeCrisis) {
    globalCityState.activeCrisis.timer -= 10;
    if (globalCityState.activeCrisis.timer <= 0) {
      // Hỏa hoạn lan rộng gây thiệt hại nặng nề
      const crisisTitle = globalCityState.activeCrisis.title;
      globalCityState.activeCrisis = null;
      globalCityState.treasury = Math.max(10000, globalCityState.treasury - 4000);
      globalCityState.ecoIndex = Math.max(20, (globalCityState.ecoIndex || 80) - 15);
      broadcast({
        type: 'city_announcement',
        announcement: `💥 HỎA HOẠN THẢM KHỐC [${crisisTitle}]: Không được dập tắt kịp thời! Thành phố thiệt hại $4,000 ngân khố!`
      });
    }
  } else {
    // 15% cơ hội phát sinh vụ cháy mới nếu có ít nhất 1 người chơi
    if (Math.random() < 0.18) {
      const fireSpots = [
        { title: 'Chập điện Xưởng Xẻ Gỗ Trung Tâm', x: 0, y: 1.0, z: -18 },
        { title: 'Nổ Lò Khí Đốt Khu Lò Cao', x: 75, y: 1.0, z: -75 },
        { title: 'Cháy Kho Nông Sản Tây Bắc', x: -65, y: 1.0, z: -75 },
        { title: 'Hỏa hoạn Bãi Tập Kết Phế Liệu', x: -55, y: 1.0, z: 90 }
      ];
      const spot = fireSpots[Math.floor(Math.random() * fireSpots.length)];
      globalCityState.activeCrisis = {
        id: 'fire_' + Date.now(),
        type: 'fire',
        title: spot.title,
        location: { x: spot.x, y: spot.y, z: spot.z },
        hp: 100,
        maxHp: 100,
        timer: 140, // 140 giây để dập
        rewardMoney: 3500,
        rewardGems: 15
      };
      broadcast({
        type: 'crisis_start',
        crisis: globalCityState.activeCrisis,
        announcement: `🚨 BÁO ĐỘNG ĐỎ 911: [${spot.title}] đang bốc cháy dữ dội! Điều động Xe Cứu Hỏa tới tọa độ (${spot.x}, ${spot.z}) dập lửa!`
      });
    }
  }

  // 4. Thu thuế thương mại tự động vào Ngân khố Thành phố
  const taxYield = Math.floor(globalCityState.population * 0.015);
  globalCityState.treasury += taxYield;

  // 5. Tỷ lệ tội phạm biến thiên
  const wantedCount = Object.keys(globalCityState.wantedPlayers || {}).length;
  globalCityState.crimeRate = Math.min(100, Math.max(6, wantedCount * 12 + Math.floor(Math.random() * 3)));

  // 6. Lưu dữ liệu & Đồng bộ thời gian thực cho mọi người chơi
  writeCityBackup();
  broadcastCityState();
}, 10000);

// -----------------------------------------------------------------------------
// KHỞI ĐỘNG MÁY CHỦ VÀ MỞ TRÌNH DUYỆT (TỰ ĐỘNG CHUYỂN CỔNG KHI TRÙNG EADDRINUSE)
// -----------------------------------------------------------------------------
let currentRunningPort = PORT;

function startServer(portToTry) {
  currentRunningPort = portToTry;
  server.listen(portToTry, HOST, () => {
    const curUrl = `http://127.0.0.1:${portToTry}/index.html`;
    console.log(`[+] Server running at http://${HOST}:${portToTry}/`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = currentRunningPort + 1;
    console.warn(`[!] Cảnh báo: Cổng ${currentRunningPort} đang bận (EADDRINUSE). Đang tự động đổi sang cổng ${nextPort}...`);
    setTimeout(() => {
      startServer(nextPort);
    }, 500);
  } else {
    console.error('[!] Lỗi máy chủ:', err.message);
  }
});

startServer(PORT);

