/* eslint-disable no-undef */
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import of faculty directory for live synchronization
import { persons } from '../src/utils/data/faculty.js';

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Email status tracking (in-memory for demo, can be extended to DB)
const emailStatusStore = new Map();

// Futuristic Custom Holidays Store
// Replaces hardcoded Javascript with API driven data
const customHolidaysStore = new Map();

// Dynamic Authenticated AP Government Higher Education Holiday Generator
const getAPGovtHolidaysForYear = (year) => {
  const holidays = [
    { day: 1, month: 1, label: "New Year's Day", type: "optional" },
    { day: 14, month: 1, label: "Bhogi", type: "general" },
    { day: 15, month: 1, label: "Makara Sankranti", type: "general" },
    { day: 16, month: 1, label: "Kanuma", type: "general" },
    { day: 26, month: 1, label: "Republic Day", type: "general" },
    { day: 5, month: 4, label: "Babu Jagjivan Ram Jayanti", type: "general" },
    { day: 14, month: 4, label: "Dr. B.R. Ambedkar Jayanti", type: "general" },
    { day: 1, month: 5, label: "May Day / Buddha Purnima", type: "optional" },
    { day: 15, month: 8, label: "Independence Day", type: "general" },
    { day: 2, month: 10, label: "Gandhi Jayanti", type: "general" },
    { day: 1, month: 11, label: "AP Formation Day", type: "general" },
    { day: 24, month: 12, label: "Christmas Eve", type: "optional" },
    { day: 25, month: 12, label: "Christmas", type: "general" },
    { day: 26, month: 12, label: "Boxing Day", type: "optional" },
  ];

  if (year === 2026) {
    holidays.push(
      { day: 3, month: 2, label: "Shab-E-Barath", type: "optional" },
      { day: 15, month: 2, label: "Maha Sivarathri", type: "general" },
      { day: 3, month: 3, label: "Holi", type: "general" },
      { day: 11, month: 3, label: "Shahadat of Hazrath Ali (R.A.)", type: "optional" },
      { day: 13, month: 3, label: "Jamatul Veda", type: "optional" },
      { day: 15, month: 3, label: "Shab-E-Qadar", type: "optional" },
      { day: 19, month: 3, label: "Ugadi", type: "general" },
      { day: 21, month: 3, label: "Eid-ul-Fitr (Ramzan)", type: "general" },
      { day: 27, month: 3, label: "Sri Rama Navami", type: "general" },
      { day: 3, month: 4, label: "Good Friday", type: "general" },
      { day: 20, month: 4, label: "Basava Jayanti", type: "optional" },
      { day: 27, month: 5, label: "Eid-ul-Adha (Bakrid)", type: "general" },
      { day: 3, month: 6, label: "Eid-E-Gadeer", type: "optional" },
      { day: 16, month: 6, label: "Moharram (Optional)", type: "optional" },
      { day: 25, month: 6, label: "Moharram (General)", type: "general" },
      { day: 16, month: 7, label: "Ratha Yatra", type: "optional" },
      { day: 4, month: 8, label: "Arbayein (Chahallum)", type: "optional" },
      { day: 21, month: 8, label: "Vara Lakshmi Vratham", type: "general" },
      { day: 25, month: 8, label: "Milad-un-Nabi", type: "general" },
      { day: 4, month: 9, label: "Sri Krishna Ashtami", type: "general" },
      { day: 14, month: 9, label: "Vinayaka Chavithi", type: "general" },
      { day: 10, month: 10, label: "Mahalaya Amavasya", type: "optional" },
      { day: 18, month: 10, label: "Durgashtami", type: "general" },
      { day: 20, month: 10, label: "Vijaya Dasami", type: "general" },
      { day: 8, month: 11, label: "Deepavali", type: "general" },
      { day: 24, month: 11, label: "Guru Nanak Jayanti", type: "optional" }
    );
  }

  return holidays.map(h => ({ ...h, year }));
};

// Seed customHolidaysStore dynamically for current and surrounding academic years
// Persistent JSON Database Storage Setup
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const HOLIDAYS_FILE = path.join(DATA_DIR, 'holidays.json');
const ADJUSTMENTS_FILE = path.join(DATA_DIR, 'adjustments.json');
const COMP_LEAVES_FILE = path.join(DATA_DIR, 'compensatory_leaves.json');
const SMTP_CONFIG_FILE = path.join(DATA_DIR, 'smtp_config.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REPORTS_STATUS_FILE = path.join(DATA_DIR, 'reports_status.json');
const LEAVE_APPLICATIONS_FILE = path.join(DATA_DIR, 'leave_applications.json');

if (!fs.existsSync(HOLIDAYS_FILE)) {
  fs.writeFileSync(HOLIDAYS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(REPORTS_STATUS_FILE)) {
  fs.writeFileSync(REPORTS_STATUS_FILE, JSON.stringify({ isPublished: false, publishedAt: null }));
}

import crypto from 'crypto';

const hashPassword = (password, salt = 'jntugv_apfrs_salt') => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

const readJSON = (filepath, fallback = []) => {
  try {
    if (!fs.existsSync(filepath)) return fallback;
    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading JSON DB ${filepath}:`, err);
    return fallback;
  }
};

const writeJSON = (filepath, data) => {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing JSON DB ${filepath}:`, err);
  }
};

const generateHashCode = (userId, email) => {
  const payload = `${userId}_${email}_jntugv_apfrs_secret`;
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 24);
};

// Seed/Load Users JSON DB (Dynamic Faculty Data & CFMS ID as Default Username/Password)
const getStoredUsers = () => {
  let users = readJSON(USERS_FILE, []);
  
  // Executive Leadership & IT Processing Accounts (@jntugv.edu.in) — Username/Email & Password Login
  const adminAccounts = [
    {
      id: 'usr_vc_01',
      email: 'vc@jntugv.edu.in',
      username: 'vc@jntugv.edu.in',
      aliasUsername: 'vc',
      name: 'Hon\'ble Vice Chancellor',
      role: 'admin',
      type: 'executive',
      department: 'University Executive Leadership',
      cfmsId: 'N/A',
      passwordHash: hashPassword('VC@JNTUGV2026')
    },
    {
      id: 'usr_reg_01',
      email: 'registrar@jntugv.edu.in',
      username: 'registrar@jntugv.edu.in',
      aliasUsername: 'registrar',
      name: 'Registrar, JNTU-GV',
      role: 'admin',
      type: 'executive',
      department: 'University Administration',
      cfmsId: 'N/A',
      passwordHash: hashPassword('Registrar@JNTUGV2026')
    },
    {
      id: 'usr_dmc_01',
      email: 'dmc@jntugv.edu.in',
      username: 'dmc@jntugv.edu.in',
      aliasUsername: 'dmc',
      name: 'Digital Monitoring Cell (DMC Coordinator)',
      role: 'admin',
      type: 'it_processing',
      department: 'Digital Monitoring Cell',
      cfmsId: 'N/A',
      passwordHash: hashPassword('DMC@JNTUGV2026')
    },
    {
      id: 'usr_dpo_01',
      email: 'dpo@jntugv.edu.in',
      username: 'dpo@jntugv.edu.in',
      aliasUsername: 'dpo',
      name: 'Data Processing Officer (DPO)',
      role: 'admin',
      type: 'it_processing',
      department: 'Attendance Processing Cell',
      cfmsId: 'N/A',
      passwordHash: hashPassword('DPO@JNTUGV2026')
    },
    {
      id: 'usr_prn_01',
      email: 'principal@jntugvcev.edu.in',
      username: 'principal@jntugvcev.edu.in',
      aliasUsername: 'principal',
      name: 'Principal, JNTU-GV CEV',
      role: 'admin',
      type: 'executive',
      isPrincipal: true,
      department: 'College Principal Office',
      cfmsId: 'N/A',
      passwordHash: hashPassword('Principal@JNTUGVCEV')
    }
  ];

  const departments = ['Administration', 'BS&HSS', 'CE', 'CSE', 'Chemistry', 'Commerce', 'ECE', 'EEE', 'IT', 'ME', 'MET', 'Physics'];
  const hodAccounts = departments.map(dept => ({
      id: `usr_hod_${dept.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      email: `hod.${dept.toLowerCase().replace(/[^a-z0-9]/g, '')}@jntugvcev.edu.in`,
      username: `hod.${dept.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      aliasUsername: `hod_${dept.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      name: `HOD - ${dept}`,
      role: 'admin',
      type: 'hod',
      isHOD: true,
      department: dept,
      cfmsId: 'N/A',
      passwordHash: hashPassword(`HOD@${dept.toUpperCase().replace(/[^A-Z0-9]/g, '')}`)
  }));

  const allSystemAccounts = [...adminAccounts, ...hodAccounts].map(acc => ({
      ...acc,
      hashCode: generateHashCode(acc.id, acc.email),
      createdAt: new Date().toISOString()
  }));

  // Dynamically map all 80+ Faculty & Staff Members from src/utils/data/faculty.js
  const mappedFaculty = (persons || []).map((f) => {
    const cleanCfms = f.cfms_id && f.cfms_id.trim() ? f.cfms_id.trim() : `CFMS100${f.id}`;
    const cleanEmail = f.email && f.email.includes('@') ? f.email.trim() : `faculty${f.id}@jntugvcev.edu.in`;
    const userId = `usr_fac_${String(f.id).padStart(3, '0')}`;
    
    return {
      id: userId,
      email: cleanEmail,
      username: cleanCfms, // CFMS ID as default Username
      aliasUsername: cleanEmail.split('@')[0],
      name: f.name,
      role: 'faculty',
      type: 'faculty',
      department: f.department || 'University Faculty',
      designation: f.designation || 'Faculty Member',
      cfmsId: cleanCfms,
      mobile: f.mobile || '',
      jobStatus: f.job_status || '',
      passwordHash: hashPassword(cleanCfms), // CFMS ID as default Password!
      hashCode: generateHashCode(userId, cleanEmail),
      createdAt: new Date().toISOString()
    };
  });

  // Check if users JSON file needs to be initialized or updated
  if (users.length === 0 || users.length < allSystemAccounts.length) {
    users = [...allSystemAccounts, ...mappedFaculty];
    writeJSON(USERS_FILE, users);
    console.log(`[Database] Seeded ${users.length} users into JSON DB.`);
  }

  return users;
};

// Seed/Load Holidays JSON DB
const getStoredHolidays = () => {
  let list = readJSON(HOLIDAYS_FILE, []);
  if (list.length === 0) {
    const currentYr = new Date().getFullYear();
    [currentYr, currentYr + 1].forEach(yr => {
      getAPGovtHolidaysForYear(yr).forEach(h => {
        list.push({ id: uuidv4(), ...h });
      });
    });
    writeJSON(HOLIDAYS_FILE, list);
  }
  return list;
};

// Seed/Load Adjustments JSON DB
const getStoredAdjustments = () => readJSON(ADJUSTMENTS_FILE, []);

// Seed/Load Compensatory Leaves JSON DB
const getStoredCompLeaves = () => readJSON(COMP_LEAVES_FILE, []);

// Seed/Load Leave Applications JSON DB
const getStoredLeaves = () => {
  return readJSON(LEAVE_APPLICATIONS_FILE, []);
};

// Seed/Load SMTP Config JSON DB
const getStoredSMTPData = () => {
  const data = readJSON(SMTP_CONFIG_FILE, { configs: [], activeId: null });
  if (!Array.isArray(data.configs)) data.configs = [];
  return data;
};

const saveStoredSMTPData = (configs, activeId) => {
  const data = { configs, activeId, updatedAt: new Date().toISOString() };
  writeJSON(SMTP_CONFIG_FILE, data);
  return data;
};


// Create reusable transporter
const createTransporter = (config) => {
  const resolveAuthValue = (primary, fallbackKeys = []) => {
    if (primary) return primary;
    for (const key of fallbackKeys) {
      if (key != null) return key;
    }
    return undefined;
  };

  const parseBoolean = (value, fallback) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'n', 'off'].includes(normalized)) return false;
    }
    return fallback;
  };

  const authUser = resolveAuthValue(
    config?.user,
    [
      config?.email,
      config?.auth?.user,
      config?.auth?.username,
      config?.credentials?.user,
      config?.auth?.email,
      process.env.SMTP_EMAIL,
    ],
  );

  const authPass = resolveAuthValue(
    config?.pass,
    [
      config?.password,
      config?.auth?.pass,
      config?.auth?.password,
      config?.credentials?.pass,
      config?.credentials?.password,
      process.env.SMTP_PASSWORD,
    ],
  );

  const portValue = config?.port || process.env.SMTP_PORT || '587';
  const numericPort = Number.parseInt(portValue, 10);

  const secureFlag = parseBoolean(config?.secure, undefined);

  const smtpConfig = {
    host: config?.host || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number.isFinite(numericPort) ? numericPort : 587,
    secure: secureFlag !== undefined ? secureFlag : portValue === '465',
    auth: {
      user: authUser,
      pass: authPass,
    },
  };

  // Handle TLS settings
  if (smtpConfig.port === 587) {
    smtpConfig.secure = false;
    smtpConfig.requireTLS = true;
  }

  const maskedUser = smtpConfig.auth.user ? `${smtpConfig.auth.user.substring(0, 3)}***` : 'not-set';

  console.log('📧 Creating SMTP transporter:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    user: maskedUser
  });

  return nodemailer.createTransport(smtpConfig);
};

// Helper: normalize `from` field — accepts string or { name, address } object
const formatFrom = (from, fallbackUser) => {
  if (!from) return `"JNTU-GV APFRS Reports" <${fallbackUser || process.env.SMTP_EMAIL}>`;
  if (typeof from === 'string') return from;
  if (from.address) {
    return from.name ? `"${from.name}" <${from.address}>` : from.address;
  }
  return `"JNTU-GV APFRS Reports" <${fallbackUser || process.env.SMTP_EMAIL}>`;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'JNTU-GV APFRS Email Service',
    timestamp: new Date().toISOString()
  });
});

// ============ AUTHENTICATION API ROUTES ============

const ALLOWED_ORG_DOMAINS = ['jntugv.edu.in', 'jntugvcev.edu.in'];

// POST /api/auth/login — Admin (Username/Email & Password) or Faculty (CFMS ID & Password)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username/Email/CFMS ID and Password are required' });
  }

  const users = getStoredUsers();
  const inputClean = username.trim();
  const inputLower = inputClean.toLowerCase();

  // Find user by Email, Username, Alias, or CFMS ID
  const user = users.find(u => 
    (u.email && u.email.toLowerCase() === inputLower) ||
    (u.username && u.username.toLowerCase() === inputLower) ||
    (u.aliasUsername && u.aliasUsername.toLowerCase() === inputLower) ||
    (u.cfmsId && u.cfmsId !== 'N/A' && u.cfmsId.trim().toLowerCase() === inputLower)
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username, CFMS ID, or password' });
  }

  const inputHash = hashPassword(password.trim());
  const isPasswordValid = 
    user.passwordHash === inputHash ||
    (user.cfmsId && user.cfmsId !== 'N/A' && password.trim() === user.cfmsId.trim());

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid username, CFMS ID, or password' });
  }

  const token = `token_${user.id}_${Date.now()}`;
  const { passwordHash, ...userProfile } = user;

  console.log(`🔑 [AUTH] Login successful for ${user.name} (${user.email || user.username})`);
  res.json({ success: true, token, user: userProfile });
});

// POST /api/auth/google — Domain-Restricted Google OAuth SSO
app.post('/api/auth/google', (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required for Google SSO' });
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain || !ALLOWED_ORG_DOMAINS.includes(domain)) {
    return res.status(403).json({
      error: `Access Denied: Domain '@${domain}' is not authorized. Please use your official JNTU-GV email (@jntugv.edu.in).`
    });
  }

  let users = getStoredUsers();
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    user = {
      id: `usr_g_${Date.now().toString(36)}`,
      email,
      username: email.split('@')[0],
      name: name || email.split('@')[0],
      role: 'faculty',
      department: 'University Faculty',
      cfmsId: `CFMS${Math.floor(10000000 + Math.random() * 90000000)}`,
      passwordHash: '',
      createdAt: new Date().toISOString()
    };
    users.push(user);
    writeJSON(USERS_FILE, users);
  }

  const token = `token_${user.id}_${Date.now()}`;
  const { passwordHash, ...userProfile } = user;

  console.log(`🔐 [AUTH] Google SSO Login successful for ${email} (${user.role})`);
  res.json({ success: true, token, user: userProfile });
});

// GET /api/auth/hashcode/:hashCode — Direct 1-Click Auto-Login via HashCode (No Manual Login Required)
app.get('/api/auth/hashcode/:hashCode', (req, res) => {
  const { hashCode } = req.params;
  if (!hashCode) {
    return res.status(400).json({ error: 'HashCode is required' });
  }

  const users = getStoredUsers();
  const user = users.find(u => u.hashCode === hashCode);

  if (!user) {
    return res.status(404).json({ error: 'Invalid or expired access hashCode link' });
  }

  const token = `token_${user.id}_${Date.now()}`;
  const { passwordHash, ...userProfile } = user;
  const redirectUrl = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';

  console.log(`🔗 [HASHCODE AUTH] Direct 1-click auto-login for ${user.email} (${user.role}) via hashCode`);
  res.json({ success: true, token, user: userProfile, redirectUrl });
});

// GET /api/auth/me — Session Token Verification
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  const parts = token.split('_');
  const userId = parts.length >= 3 ? `${parts[1]}_${parts[2]}` : null;

  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }

  const { passwordHash, ...userProfile } = user;
  res.json({ user: userProfile });
});

// GET /api/auth/users — Admin list users
app.get('/api/auth/users', (req, res) => {
  const users = getStoredUsers().map(({ passwordHash, ...u }) => u);
  res.json({ users });
});

// ============ FACULTY LEAVE APPLICATION API ROUTES ============

// GET /api/leaves/my-applications — Get leave applications for logged in faculty
app.get('/api/leaves/my-applications', (req, res) => {
  const { email } = req.query;
  const leaves = getStoredLeaves();
  if (email) {
    const filtered = leaves.filter(l => l.facultyEmail.toLowerCase() === email.toLowerCase());
    return res.json({ leaves: filtered });
  }
  res.json({ leaves });
});

// POST /api/leaves/apply — Apply for Casual (CL), On Duty (OD), Special (SL), or Academic Leave (AL)
app.post('/api/leaves/apply', (req, res) => {
  const { facultyEmail, facultyName, department, cfmsId, leaveType, startDate, endDate, reason, targetApprover } = req.body;

  if (!facultyEmail || !leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ error: 'Missing required leave fields (leaveType, startDate, endDate, reason)' });
  }

  // AL (Academic Leave) constraint: Only allowed between 1st - 25th of every month
  const today = new Date();
  const currentDayOfMonth = today.getDate();
  if (leaveType === 'AL' && (currentDayOfMonth < 1 || currentDayOfMonth > 25)) {
    return res.status(400).json({
      error: `Academic Leaves (AL) can only be submitted between the 1st and 25th of every month. Today is Day ${currentDayOfMonth}.`
    });
  }

  const leaveTypeNameMap = {
    'CL': 'Casual Leave (CL)',
    'OD': 'On Duty Leave (OD)',
    'SL': 'Special Leave (SL)',
    'AL': 'Academic Leave (AL)'
  };

  const leaves = getStoredLeaves();
  const origStart = new Date(startDate);
  const origEnd = new Date(endDate);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(end - start);
  let daysCount = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Half-Day calculation
  if (daysCount === 1 && origStart.getHours() >= 12) {
      daysCount = 0.5;
  }

  const newLeave = {
    id: `lv_${Date.now()}`,
    facultyEmail,
    facultyName: facultyName || facultyEmail.split('@')[0],
    department: department || 'University Faculty',
    cfmsId: cfmsId || 'N/A',
    leaveType,
    leaveTypeName: leaveTypeNameMap[leaveType] || leaveType,
    startDate,
    endDate,
    daysCount: isNaN(daysCount) || daysCount <= 0 ? 1 : daysCount,
    reason,
    targetApprover: targetApprover || 'HOD', // 'HOD' | 'Principal' | 'Registrar'
    status: 'PENDING_HOD', // Starts at HOD level
    history: [{
      action: 'SUBMITTED',
      actor: facultyName,
      timestamp: new Date().toISOString(),
      remarks: 'Leave applied'
    }],
    createdAt: new Date().toISOString()
  };

  leaves.unshift(newLeave);
  writeJSON(LEAVE_APPLICATIONS_FILE, leaves);

  console.log(`📝 [LEAVES] Leave application submitted by ${newLeave.facultyName} (${leaveType}) -> target: ${newLeave.targetApprover}, status: ${newLeave.status}`);
  res.json({ success: true, leave: newLeave, message: 'Leave application submitted successfully for HOD approval.' });
});

// GET /api/leaves/pending-approvals — List leave applications for specific approver roles
app.get('/api/leaves/pending-approvals', (req, res) => {
  const { role, department } = req.query; // role: 'HOD' | 'Principal' | 'Registrar'
  const leaves = getStoredLeaves();
  
  let pendingLeaves = [];
  if (role === 'HOD') {
      // HOD sees PENDING_HOD for their specific department
      pendingLeaves = leaves.filter(l => l.status === 'PENDING_HOD' && (!department || l.department === department));
  } else if (role === 'Principal') {
      // Principal sees PENDING_PRINCIPAL across all departments
      pendingLeaves = leaves.filter(l => l.status === 'PENDING_PRINCIPAL');
  } else if (role === 'Registrar') {
      // Registrar sees PENDING_REGISTRAR across all departments
      pendingLeaves = leaves.filter(l => l.status === 'PENDING_REGISTRAR');
  } else {
      // Admin sees everything
      pendingLeaves = leaves;
  }
  
  res.json({ leaves: pendingLeaves });
});

// POST /api/leaves/action — HOD/Principal/Registrar approve/reject action
app.post('/api/leaves/action', (req, res) => {
  const { leaveId, action, remarks, actorName, actorRole } = req.body; 
  // action: 'APPROVE' | 'REJECT', actorRole: 'HOD' | 'Principal' | 'Registrar'
  if (!leaveId || !['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ error: 'Valid leaveId and action (APPROVE/REJECT) are required' });
  }

  let leaves = getStoredLeaves();
  let updatedLeave = null;

  leaves = leaves.map(l => {
    if (l.id === leaveId) {
      const historyEntry = {
          action: action === 'REJECT' ? 'REJECTED' : 'APPROVED',
          actor: actorName || actorRole,
          actorRole,
          timestamp: new Date().toISOString(),
          remarks: remarks || ''
      };
      
      let nextStatus = l.status;
      if (action === 'REJECT') {
          nextStatus = 'REJECTED';
      } else if (action === 'APPROVE') {
          if (actorRole === 'HOD') {
              nextStatus = 'PENDING_PRINCIPAL'; // Always routes to Principal next
          } else if (actorRole === 'Principal') {
              if (l.targetApprover === 'Registrar') {
                  nextStatus = 'PENDING_REGISTRAR';
              } else {
                  nextStatus = 'APPROVED'; // Done if target was HOD or Principal
              }
          } else if (actorRole === 'Registrar') {
              nextStatus = 'APPROVED'; // Done
          }
      }

      updatedLeave = {
        ...l,
        status: nextStatus,
        history: [...(l.history || []), historyEntry],
        actionAt: new Date().toISOString()
      };
      return updatedLeave;
    }
    return l;
  });

  if (!updatedLeave) {
    return res.status(404).json({ error: 'Leave application not found' });
  }

  writeJSON(LEAVE_APPLICATIONS_FILE, leaves);
  console.log(`✅ [LEAVES] ${actorRole} ${action}D leave application ${leaveId} for ${updatedLeave.facultyName}. New Status: ${updatedLeave.status}`);
  res.json({ success: true, leave: updatedLeave });
});

// POST /api/leaves/import-google-form — Bulk import Google Form Response leave records
app.post('/api/leaves/import-google-form', (req, res) => {
  const { newLeaves } = req.body;
  if (!Array.isArray(newLeaves) || newLeaves.length === 0) {
    return res.status(400).json({ error: 'No leave applications provided for import' });
  }

  let leaves = getStoredLeaves();
  const newIds = new Set(newLeaves.map(n => n.id));
  leaves = leaves.filter(l => !newIds.has(l.id));

  leaves = [...newLeaves, ...leaves];
  writeJSON(LEAVE_APPLICATIONS_FILE, leaves);

  console.log(`📋 [GOOGLE FORMS] Successfully imported ${newLeaves.length} leave records from Google Form responses.`);
  res.json({ success: true, count: newLeaves.length, leaves });
});

// ============ SMTP CONFIG API ROUTES (PERSISTENT JSON DATABASE) ============

// GET /api/smtp-config — Fetch persistent SMTP configuration
app.get('/api/smtp-config', (req, res) => {
  const data = getStoredSMTPData();
  const activeConfig = data.configs.find(c => c.id === data.activeId) || data.configs[0] || null;
  res.json({ configs: data.configs, activeConfig, activeId: data.activeId });
});

// POST /api/smtp-config — Save/Update an SMTP configuration
app.post('/api/smtp-config', (req, res) => {
  const config = req.body;
  if (!config || !config.host || !config.user) {
    return res.status(400).json({ error: 'Missing required configuration fields (host, user)' });
  }

  const data = getStoredSMTPData();
  let configs = [...data.configs];
  let activeId = data.activeId;
  const now = new Date().toISOString();

  let savedConfig;
  if (config.id) {
    configs = configs.map(c => {
      if (c.id === config.id) {
        savedConfig = { ...c, ...config, updatedAt: now };
        return savedConfig;
      }
      return c;
    });
  } else {
    const id = `smtp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    savedConfig = { ...config, id, createdAt: now, updatedAt: now };
    configs.push(savedConfig);
  }

  if (config.isActive || !activeId) {
    activeId = savedConfig.id;
  }

  configs = configs.map(c => ({ ...c, isActive: c.id === activeId }));
  saveStoredSMTPData(configs, activeId);

  console.log(`🔐 [JSON DB] SMTP Configuration updated: ${savedConfig.name || savedConfig.host} (${activeId})`);
  res.json({ config: savedConfig, configs, activeConfig: savedConfig, activeId });
});

// POST /api/smtp-config/active — Set active configuration
app.post('/api/smtp-config/active', (req, res) => {
  const { id } = req.body;
  const data = getStoredSMTPData();
  const target = data.configs.find(c => c.id === id);

  if (!target) {
    return res.status(404).json({ error: 'Configuration not found' });
  }

  const configs = data.configs.map(c => ({ ...c, isActive: c.id === id }));
  saveStoredSMTPData(configs, id);

  console.log(`🔐 [JSON DB] Active SMTP Account set to: ${target.name || target.host} (${id})`);
  res.json({ activeConfig: target, configs, activeId: id });
});

// DELETE /api/smtp-config/:id — Delete configuration
app.delete('/api/smtp-config/:id', (req, res) => {
  const { id } = req.params;
  const data = getStoredSMTPData();
  const configs = data.configs.filter(c => c.id !== id);
  let activeId = data.activeId;

  if (activeId === id) {
    activeId = configs[0]?.id || null;
  }

  const updatedConfigs = configs.map(c => ({ ...c, isActive: c.id === activeId }));
  saveStoredSMTPData(updatedConfigs, activeId);

  console.log(`🗑️ [JSON DB] SMTP Configuration deleted: ${id}`);
  res.json({ success: true, configs: updatedConfigs, activeId });
});

// ============ HOLIDAY API ROUTES (PERSISTENT JSON DATABASE) ============

// GET /api/holidays/:year — Fetch all holidays for a given year
app.get('/api/holidays/:year', (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  const allHolidays = getStoredHolidays();
  const holidays = allHolidays.filter(h => h.year === year);
  res.json({ holidays });
});

// POST /api/holidays — Add a new custom holiday
app.post('/api/holidays', (req, res) => {
  const { label, type, year, month, day } = req.body;

  if (!label || !type || !year || !month || !day) {
    return res.status(400).json({ error: 'Missing required fields: label, type, year, month, day' });
  }

  const allHolidays = getStoredHolidays();
  const id = uuidv4();
  const newHoliday = { id, label, type, year: Number(year), month: Number(month), day: Number(day) };

  allHolidays.push(newHoliday);
  writeJSON(HOLIDAYS_FILE, allHolidays);

  console.log(`📅 [JSON DB] Holiday added: ${label} on ${year}-${month}-${day} (${type})`);
  res.status(201).json(newHoliday);
});

// DELETE /api/holidays/:id — Delete a custom holiday by ID
app.delete('/api/holidays/:id', (req, res) => {
  const { id } = req.params;
  const allHolidays = getStoredHolidays();

  const index = allHolidays.findIndex(h => h.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Holiday not found' });
  }

  const deleted = allHolidays.splice(index, 1)[0];
  writeJSON(HOLIDAYS_FILE, allHolidays);

  console.log(`🗑️ [JSON DB] Holiday deleted: ${deleted.label} (${id})`);
  res.json({ success: true, deleted });
});

// PUT /api/holidays/:id/adjust — Adjust a holiday's date (moon cycle / GO change)
app.put('/api/holidays/:id/adjust', (req, res) => {
  const { id } = req.params;
  const { newDay, newMonth, reason, goReference } = req.body;

  let allHolidays = getStoredHolidays();
  const holidayIndex = allHolidays.findIndex(h => h.id === id);

  if (holidayIndex === -1) {
    return res.status(404).json({ error: 'Holiday not found' });
  }

  if (!newDay || !newMonth) {
    return res.status(400).json({ error: 'Missing required fields: newDay, newMonth' });
  }

  const holiday = allHolidays[holidayIndex];
  const originalDate = { day: holiday.day, month: holiday.month, year: holiday.year };

  // Record adjustment in JSON DB
  const adjustmentId = uuidv4();
  const adjustment = {
    id: adjustmentId,
    holidayId: id,
    holidayLabel: holiday.label,
    originalDate,
    newDate: { day: Number(newDay), month: Number(newMonth), year: holiday.year },
    reason: reason || '',
    goReference: goReference || '',
    adjustedAt: new Date().toISOString()
  };

  const adjustments = getStoredAdjustments();
  adjustments.push(adjustment);
  writeJSON(ADJUSTMENTS_FILE, adjustments);

  // Update holiday in JSON DB
  holiday.day = Number(newDay);
  holiday.month = Number(newMonth);
  allHolidays[holidayIndex] = holiday;
  writeJSON(HOLIDAYS_FILE, allHolidays);

  console.log(`🔄 [JSON DB] Holiday adjusted: ${holiday.label} from ${originalDate.day}/${originalDate.month} → ${newDay}/${newMonth} (${goReference || 'No GO ref'})`);
  res.json({ holiday, adjustment });
});

// GET /api/holidays/:year/adjustments — Fetch all adjustments for a year
app.get('/api/holidays/:year/adjustments', (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  const allAdjustments = getStoredAdjustments();
  const adjustments = allAdjustments.filter(
    adj => (adj.originalDate && adj.originalDate.year === year) || (adj.newDate && adj.newDate.year === year)
  );

  res.json({ adjustments });
});

// ============ COMPENSATORY LEAVE ROUTES (PERSISTENT JSON DATABASE) ============

// GET /api/compensatory-leaves/:year — Fetch all compensatory leaves for a year
app.get('/api/compensatory-leaves/:year', (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  const allLeaves = getStoredCompLeaves();
  const leaves = allLeaves.filter(leave => leave.compensatoryDate && leave.compensatoryDate.year === year);
  res.json({ leaves });
});

// POST /api/compensatory-leaves — Add a compensatory leave
app.post('/api/compensatory-leaves', (req, res) => {
  const { originalHolidayLabel, originalDate, compensatoryDate, reason, goReference } = req.body;

  if (!originalHolidayLabel || !originalDate || !compensatoryDate) {
    return res.status(400).json({ error: 'Missing required fields: originalHolidayLabel, originalDate, compensatoryDate' });
  }

  const allLeaves = getStoredCompLeaves();
  const id = uuidv4();
  const leave = {
    id,
    originalHolidayLabel,
    originalDate: {
      day: Number(originalDate.day),
      month: Number(originalDate.month),
      year: Number(originalDate.year)
    },
    compensatoryDate: {
      day: Number(compensatoryDate.day),
      month: Number(compensatoryDate.month),
      year: Number(compensatoryDate.year)
    },
    reason: reason || `${originalHolidayLabel} fell on a weekend`,
    goReference: goReference || '',
    type: 'compensatory',
    createdAt: new Date().toISOString()
  };

  allLeaves.push(leave);
  writeJSON(COMP_LEAVES_FILE, allLeaves);

  console.log(`🔁 [JSON DB] Compensatory leave added: ${originalHolidayLabel} (${originalDate.day}/${originalDate.month}) → Comp-off on ${compensatoryDate.day}/${compensatoryDate.month}/${compensatoryDate.year}`);
  res.status(201).json(leave);
});

// DELETE /api/compensatory-leaves/:id — Remove a compensatory leave
app.delete('/api/compensatory-leaves/:id', (req, res) => {
  const { id } = req.params;
  const allLeaves = getStoredCompLeaves();

  const index = allLeaves.findIndex(leave => leave.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Compensatory leave not found' });
  }

  const deleted = allLeaves.splice(index, 1)[0];
  writeJSON(COMP_LEAVES_FILE, allLeaves);

  console.log(`🗑️ [JSON DB] Compensatory leave deleted: ${deleted.originalHolidayLabel} (${id})`);
  res.json({ success: true, deleted });
});

// GET /api/holidays/:year/weekend-conflicts — Detect holidays falling on Sunday/2nd Saturday
app.get('/api/holidays/:year/weekend-conflicts', (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  const allHolidays = getStoredHolidays();
  const allLeaves = getStoredCompLeaves();
  const conflicts = [];

  for (const holiday of allHolidays) {
    if (holiday.year !== year) continue;
    if (holiday.type !== 'general' && holiday.type !== 'festival') continue;

    const date = new Date(holiday.year, holiday.month - 1, holiday.day);
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

    if (dayOfWeek === 0) {
      const alreadyCompensated = allLeaves.some(
        cl => cl.originalHolidayLabel === holiday.label &&
              cl.originalDate.day === holiday.day &&
              cl.originalDate.month === holiday.month &&
              cl.originalDate.year === holiday.year
      );

      conflicts.push({
        holidayId: holiday.id,
        label: holiday.label,
        date: { day: holiday.day, month: holiday.month, year: holiday.year },
        conflictType: 'sunday',
        conflictLabel: 'Falls on Sunday',
        alreadyCompensated,
        suggestedCompDate: getSuggestedCompDate(holiday.year, holiday.month, holiday.day)
      });
    }

    if (dayOfWeek === 6) {
      let satCount = 0;
      for (let d = 1; d <= holiday.day; d++) {
        if (new Date(holiday.year, holiday.month - 1, d).getDay() === 6) {
          satCount++;
        }
      }
      if (satCount === 2) {
        const alreadyCompensated = allLeaves.some(
          cl => cl.originalHolidayLabel === holiday.label &&
                cl.originalDate.day === holiday.day &&
                cl.originalDate.month === holiday.month &&
                cl.originalDate.year === holiday.year
        );

        conflicts.push({
          holidayId: holiday.id,
          label: holiday.label,
          date: { day: holiday.day, month: holiday.month, year: holiday.year },
          conflictType: 'second_saturday',
          conflictLabel: 'Falls on 2nd Saturday',
          alreadyCompensated,
          suggestedCompDate: getSuggestedCompDate(holiday.year, holiday.month, holiday.day)
        });
      }
    }
  }

  res.json({ conflicts });
});

// Helper: suggest next working day for compensatory leave
function getSuggestedCompDate(year, month, day) {
  let d = new Date(year, month - 1, day);
  // Move to next day and skip weekends
  for (let i = 0; i < 7; i++) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0) { // Skip Sundays (2nd Sat check is too complex here, just skip Sundays)
      return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
    }
  }
  // Fallback: next day
  d = new Date(year, month - 1, day + 1);
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}

// ============ EMAIL ROUTES ============

// Send individual email
app.post('/api/send-email', async (req, res) => {
  const { config, emailData } = req.body;
  const emailId = uuidv4();

  try {
    console.log(`📤 Processing email request ${emailId}`);
    console.log('Recipients:', emailData.to);

    if (!emailData.to || emailData.to.length === 0) {
      throw new Error('No recipients specified');
    }

    const transporter = createTransporter(config || {});

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Prepare email options
    const mailOptions = {
      from: formatFrom(emailData.from, config?.user),
      to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
      subject: emailData.subject || 'JNTU-GV APFRS - Attendance Report',
      html: emailData.html,
      text: emailData.text,
      replyTo: emailData.replyTo,
      attachments: emailData.attachments || []
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully: ${info.messageId}`);

    // Store status
    emailStatusStore.set(emailId, {
      id: emailId,
      status: 'sent',
      messageId: info.messageId,
      recipients: emailData.to,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      messageId: info.messageId,
      emailId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Email send failed for ${emailId}:`, error.message);

    // Store failed status
    emailStatusStore.set(emailId, {
      id: emailId,
      status: 'failed',
      error: error.message,
      recipients: emailData?.to,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: error.message,
      emailId,
      hint: getErrorHint(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Send bulk emails
app.post('/api/send-bulk-emails', async (req, res) => {
  const { config, emails } = req.body;
  const batchId = uuidv4();

  console.log(`📨 Starting bulk email batch ${batchId} with ${emails?.length || 0} emails`);

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No emails provided',
      batchId
    });
  }

  const results = [];
  const transporter = createTransporter(config || {});

  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified for bulk send');
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `SMTP connection failed: ${error.message}`,
      batchId
    });
  }

  for (let i = 0; i < emails.length; i++) {
    const emailData = emails[i];
    const emailId = uuidv4();

    try {
      const mailOptions = {
        from: formatFrom(emailData.from, config?.user),
        to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
        subject: emailData.subject || 'JNTU-GV APFRS - Attendance Report',
        html: emailData.html,
        text: emailData.text,
        attachments: emailData.attachments || []
      };

      const info = await transporter.sendMail(mailOptions);

      results.push({
        emailId,
        success: true,
        messageId: info.messageId,
        recipient: emailData.to,
        employeeId: emailData.employeeId,
        employeeName: emailData.employeeName
      });

      console.log(`✅ [${i + 1}/${emails.length}] Sent to ${emailData.to}`);

      // Small delay between emails to avoid rate limiting
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      results.push({
        emailId,
        success: false,
        error: error.message,
        recipient: emailData.to,
        employeeId: emailData.employeeId,
        employeeName: emailData.employeeName
      });

      console.error(`❌ [${i + 1}/${emails.length}] Failed for ${emailData.to}: ${error.message}`);
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`📊 Batch ${batchId} complete: ${successCount} sent, ${failCount} failed`);

  res.json({
    success: failCount === 0,
    batchId,
    summary: {
      total: emails.length,
      sent: successCount,
      failed: failCount
    },
    results,
    timestamp: new Date().toISOString()
  });
});

// Get email status
app.get('/api/email-status/:id', (req, res) => {
  const status = emailStatusStore.get(req.params.id);
  if (status) {
    res.json(status);
  } else {
    res.status(404).json({ error: 'Email status not found' });
  }
});

// Test SMTP connection
app.post('/api/test-smtp', async (req, res) => {
  const { config } = req.body;

  try {
    const transporter = createTransporter(config || {});
    await transporter.verify();

    res.json({
      success: true,
      message: 'SMTP connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      hint: getErrorHint(error),
      timestamp: new Date().toISOString()
    });
  }
});

// --- HOLIDAY API ENDPOINTS ---

// Get holidays for a specific year
app.get('/api/holidays/:year', (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (isNaN(year)) {
    return res.status(400).json({ error: 'Invalid year parameter' });
  }

  const yearHolidays = Array.from(customHolidaysStore.values()).filter(h => h.year === year);
  res.json({ holidays: yearHolidays });
});

// Add a new custom holiday
app.post('/api/holidays', (req, res) => {
  const { day, month, year, label, type } = req.body;

  if (!day || !month || !year || !label) {
    return res.status(400).json({ error: 'Missing required holiday fields' });
  }

  const id = uuidv4();
  const newHoliday = { id, day, month, year, label, type: type || 'general' };

  customHolidaysStore.set(id, newHoliday);

  console.log(`📅 Added new holiday: ${label} on ${month}/${day}/${year}`);
  res.status(201).json(newHoliday);
});

// Delete a custom holiday
app.delete('/api/holidays/:id', (req, res) => {
  const { id } = req.params;

  if (customHolidaysStore.has(id)) {
    const deleted = customHolidaysStore.get(id);
    customHolidaysStore.delete(id);
    console.log(`📅 Deleted holiday: ${deleted.label}`);
    res.json({ success: true, message: 'Holiday deleted' });
  } else {
    res.status(404).json({ error: 'Holiday not found' });
  }
});

// Helper function for error hints
function getErrorHint(error) {
  const message = error.message?.toLowerCase() || '';

  if (message.includes('auth') || message.includes('credentials')) {
    return 'Check your email credentials. For Gmail, use an App Password instead of your regular password.';
  }
  if (message.includes('timeout') || message.includes('connect')) {
    return 'Connection timeout. Check your SMTP host and port settings.';
  }
  if (message.includes('certificate') || message.includes('ssl')) {
    return 'SSL/TLS certificate issue. Try changing the secure/port settings.';
  }
  if (message.includes('rate') || message.includes('limit')) {
    return 'Rate limit exceeded. Wait a few minutes before sending more emails.';
  }

  return 'Check your SMTP configuration and ensure the server is accessible.';
}

// --- REPORTS STATUS ENDPOINTS ---

app.get('/api/reports/status', (req, res) => {
  const status = readJSON(REPORTS_STATUS_FILE) || { isPublished: false };
  res.json(status);
});

app.post('/api/reports/publish', (req, res) => {
  const { isPublished } = req.body;
  const status = {
    isPublished: !!isPublished,
    publishedAt: isPublished ? new Date().toISOString() : null
  };
  writeJSON(REPORTS_STATUS_FILE, status);
  res.json(status);
});

// ============ PRODUCTION STATIC FILE SERVING ============
// Serve the frontend dist directory
const frontendDistPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  
  // Catch-all route to serve React's index.html for unknown routes (React Router support)
  app.get('*', (req, res) => {
    // Exclude API routes from catch-all to prevent HTML responses for API 404s
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 JNTU-GV APFRS Email Service running on port ${PORT}`);
  console.log(`📧 SMTP Host: ${process.env.SMTP_HOST || 'Not configured'}`);
  console.log(`📧 SMTP User: ${process.env.SMTP_EMAIL?.substring(0, 5) || 'Not configured'}***`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Kill the existing process and restart.`);
    console.error(`   Run: Get-NetTCPConnection -LocalPort ${PORT} | Select OwningProcess`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});
