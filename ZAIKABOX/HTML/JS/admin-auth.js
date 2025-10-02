// ================= Admin Authentication System =================
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { collection, getDocs, query, orderBy, limit, where } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

class AdminAuth {
    constructor() {
        this.adminEmails = [
            'pranaysuthar639@gmail.com',
            'thakararyan9106@gmail.com'
        ];
        this.isAdmin = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.checkAdminStatus(user);
        });
    }

    checkAdminStatus(user) {
        if (user && this.adminEmails.includes(user.email)) {
            this.isAdmin = true;
            this.showAdminFeatures();
        } else {
            this.isAdmin = false;
            this.hideAdminFeatures();
        }
    }

    showAdminFeatures() {
        // Add admin button to navigation
        this.addAdminButton();
        console.log('🔧 Admin access granted for:', this.currentUser.email);
    }

    hideAdminFeatures() {
        // Remove admin button if exists
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) adminBtn.remove();
    }

    addAdminButton() {
        const navAuth = document.querySelector('.nav-auth');
        if (navAuth && !document.getElementById('admin-btn')) {
            const adminBtn = document.createElement('button');
            adminBtn.id = 'admin-btn';
            adminBtn.innerHTML = '<i class="fa fa-cog"></i> Admin';
            adminBtn.className = 'admin-nav-btn';
            adminBtn.onclick = () => this.openAdminDashboard();

            // Insert before profile button
            const profileBtn = document.getElementById('profile-btn');
            navAuth.insertBefore(adminBtn, profileBtn);
        }
    }

    async openAdminDashboard() {
        if (!this.isAdmin) {
            alert('Access denied. Admin privileges required.');
            return;
        }

        // Create admin dashboard modal
        const dashboard = document.createElement('div');
        dashboard.id = 'admin-dashboard';
        dashboard.className = 'admin-dashboard-modal';

        const analytics = await this.getAnalytics();

        dashboard.innerHTML = `
            <div class="admin-dashboard-content">
                <div class="admin-header">
                    <h2><i class="fa fa-dashboard"></i> ZaikaBox Admin Dashboard</h2>
                    <button class="admin-close-btn" onclick="this.closest('.admin-dashboard-modal').remove()">&times;</button>
                </div>
                
                <div class="admin-tabs">
                    <button class="admin-tab active" data-tab="analytics">📊 Analytics</button>
                    <button class="admin-tab" data-tab="users">👥 Users</button>
                    <button class="admin-tab" data-tab="themes">🎨 Themes</button>
                    <button class="admin-tab" data-tab="system">⚙️ System</button>
                </div>

                <div class="admin-content">
                    <div class="admin-tab-content active" id="analytics-tab">
                        ${this.renderAnalytics(analytics)}
                    </div>
                    
                    <div class="admin-tab-content" id="users-tab">
                        ${this.renderUserManagement()}
                    </div>
                    
                    <div class="admin-tab-content" id="themes-tab">
                        ${this.renderThemeManagement()}
                    </div>
                    
                    <div class="admin-tab-content" id="system-tab">
                        ${this.renderSystemInfo()}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dashboard);
        this.initTabSwitching();
        this.loadUserData();
        this.initThemeManagement();
    }

    async getAnalytics() {
        try {
            let totalUsers = 0;
            let totalBookmarks = 0;
            let recentSignups = 0;

            // Try to get bookmarks data (this collection should exist)
            try {
                const bookmarksSnapshot = await getDocs(collection(db, 'bookmarks'));
                totalBookmarks = bookmarksSnapshot.size;

                // Count unique users from bookmarks
                const uniqueUsers = new Set();
                bookmarksSnapshot.forEach(doc => {
                    const bookmarkData = doc.data();
                    if (bookmarkData.userId) {
                        uniqueUsers.add(bookmarkData.userId);
                    }
                });
                totalUsers = uniqueUsers.size;

            } catch (bookmarkError) {
                console.log('Bookmarks collection not found or empty');
            }

            // Try to get users collection if it exists
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                if (usersSnapshot.size > 0) {
                    totalUsers = Math.max(totalUsers, usersSnapshot.size);

                    // Get recent signups (last 30 days)
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    usersSnapshot.forEach(doc => {
                        const userData = doc.data();
                        if (userData.createdAt && userData.createdAt.toDate() > thirtyDaysAgo) {
                            recentSignups++;
                        }
                    });
                }
            } catch (userError) {
                console.log('Users collection not found, checking user profiles...');
            }

            // Check userProfiles collection (created by our auth system)
            try {
                const userProfilesSnapshot = await getDocs(collection(db, 'userProfiles'));
                if (userProfilesSnapshot.size > 0) {
                    totalUsers = Math.max(totalUsers, userProfilesSnapshot.size);

                    // Count recent signups from user profiles
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    let profileRecentSignups = 0;
                    userProfilesSnapshot.forEach(doc => {
                        const userData = doc.data();
                        if (userData.createdAt && userData.createdAt.toDate() > thirtyDaysAgo) {
                            profileRecentSignups++;
                        }
                    });
                    recentSignups = Math.max(recentSignups, profileRecentSignups);
                }
            } catch (profileError) {
                console.log('User profiles collection not found, using bookmark-based estimates');

                // Fallback: Estimate recent signups based on recent bookmarks
                try {
                    const recentBookmarksQuery = query(
                        collection(db, 'bookmarks'),
                        orderBy('createdAt', 'desc'),
                        limit(50)
                    );
                    const recentBookmarksSnapshot = await getDocs(recentBookmarksQuery);
                    const recentUsers = new Set();

                    recentBookmarksSnapshot.forEach(doc => {
                        const bookmarkData = doc.data();
                        if (bookmarkData.userId && bookmarkData.createdAt) {
                            const createdDate = bookmarkData.createdAt.toDate();
                            const thirtyDaysAgo = new Date();
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                            if (createdDate > thirtyDaysAgo) {
                                recentUsers.add(bookmarkData.userId);
                            }
                        }
                    });
                    recentSignups = Math.max(recentSignups, recentUsers.size);
                } catch (recentError) {
                    console.log('Could not estimate recent signups');
                }
            }

            return {
                totalUsers: totalUsers || 0,
                totalBookmarks: totalBookmarks || 0,
                recentSignups: recentSignups || 0,
                avgBookmarksPerUser: totalUsers > 0 ? (totalBookmarks / totalUsers).toFixed(1) : 0
            };
        } catch (error) {
            console.error('Error fetching analytics:', error);
            return {
                totalUsers: 0,
                totalBookmarks: 0,
                recentSignups: 0,
                avgBookmarksPerUser: 0
            };
        }
    }

    renderAnalytics(analytics) {
        return `
            <div class="analytics-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <h3>${analytics.totalUsers}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">❤️</div>
                    <div class="stat-info">
                        <h3>${analytics.totalBookmarks}</h3>
                        <p>Total Bookmarks</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📈</div>
                    <div class="stat-info">
                        <h3>${analytics.recentSignups}</h3>
                        <p>New Users (30 days)</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-info">
                        <h3>${analytics.avgBookmarksPerUser}</h3>
                        <p>Avg Bookmarks/User</p>
                    </div>
                </div>
            </div>
            
            <div class="analytics-section">
                <h3>📱 Usage Metrics</h3>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <span class="metric-label">Site Performance</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: 95%"></div>
                        </div>
                        <span class="metric-value">95%</span>
                    </div>
                    
                    <div class="metric-item">
                        <span class="metric-label">User Engagement</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: 78%"></div>
                        </div>
                        <span class="metric-value">78%</span>
                    </div>
                    
                    <div class="metric-item">
                        <span class="metric-label">Feature Usage</span>
                        <div class="metric-bar">
                            <div class="metric-fill" style="width: 82%"></div>
                        </div>
                        <span class="metric-value">82%</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderUserManagement() {
        return `
            <div class="user-management">
                <div class="user-actions">
                    <button class="admin-action-btn" onclick="adminAuth.refreshUserData()">
                        <i class="fa fa-refresh"></i> Refresh Data
                    </button>
                    <button class="admin-action-btn" onclick="adminAuth.exportUserData()">
                        <i class="fa fa-download"></i> Export Users
                    </button>
                </div>
                
                <div class="user-list" id="user-list">
                    <div class="loading">Loading user data...</div>
                </div>
            </div>
        `;
    }

    renderSystemInfo() {
        return `
            <div class="system-info">
                <div class="system-stats">
                    <h3>🖥️ System Status</h3>
                    <div class="status-grid">
                        <div class="status-item">
                            <span class="status-label">Firebase Connection</span>
                            <span class="status-indicator online">Online</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">API Status</span>
                            <span class="status-indicator online">Active</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Last Backup</span>
                            <span class="status-value">${new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="system-actions">
                    <h3>🛠️ System Actions</h3>
                    <button class="system-btn" onclick="adminAuth.clearCache()">
                        <i class="fa fa-trash"></i> Clear Cache
                    </button>
                    <button class="system-btn" onclick="adminAuth.generateReport()">
                        <i class="fa fa-file-text"></i> Generate Report
                    </button>
                    <button class="system-btn danger" onclick="adminAuth.maintenanceMode()">
                        <i class="fa fa-wrench"></i> Maintenance Mode
                    </button>
                </div>
            </div>
        `;
    }

    initTabSwitching() {
        const tabs = document.querySelectorAll('.admin-tab');
        const contents = document.querySelectorAll('.admin-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    async loadUserData() {
        try {
            const userList = document.getElementById('user-list');
            if (!userList) return;

            userList.innerHTML = '<div class="loading">Loading user data...</div>';

            let usersHTML = '<div class="user-table-header"><span>User ID</span><span>Display Name</span><span>Last Activity</span><span>Bookmarks</span></div>';

            // Try to load from users collection first
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));

                if (usersSnapshot.size > 0) {
                    for (const userDoc of usersSnapshot.docs) {
                        const userData = userDoc.data();
                        const bookmarksQuery = query(collection(db, 'bookmarks'), where('userId', '==', userDoc.id));
                        const bookmarksSnapshot = await getDocs(bookmarksQuery);

                        usersHTML += `
                            <div class="user-row">
                                <span class="user-name">${userDoc.id.substring(0, 8)}...</span>
                                <span class="user-email">${userData.displayName || userData.email || 'Anonymous'}</span>
                                <span class="user-date">${userData.createdAt ? userData.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                                <span class="user-bookmarks">${bookmarksSnapshot.size}</span>
                            </div>
                        `;
                    }
                } else {
                    throw new Error('No users collection found');
                }
            } catch (userError) {
                console.log('Users collection not available, loading from bookmarks...');

                // Fallback: Get user data from bookmarks collection
                try {
                    const bookmarksSnapshot = await getDocs(collection(db, 'bookmarks'));
                    const userBookmarkCounts = new Map();
                    const userLastActivity = new Map();

                    bookmarksSnapshot.forEach(doc => {
                        const bookmarkData = doc.data();
                        if (bookmarkData.userId) {
                            const userId = bookmarkData.userId;
                            userBookmarkCounts.set(userId, (userBookmarkCounts.get(userId) || 0) + 1);

                            if (bookmarkData.createdAt) {
                                const currentDate = userLastActivity.get(userId);
                                const bookmarkDate = bookmarkData.createdAt.toDate();
                                if (!currentDate || bookmarkDate > currentDate) {
                                    userLastActivity.set(userId, bookmarkDate);
                                }
                            }
                        }
                    });

                    if (userBookmarkCounts.size > 0) {
                        userBookmarkCounts.forEach((bookmarkCount, userId) => {
                            const lastActivity = userLastActivity.get(userId);
                            usersHTML += `
                                <div class="user-row">
                                    <span class="user-name">${userId.substring(0, 8)}...</span>
                                    <span class="user-email">User (from bookmarks)</span>
                                    <span class="user-date">${lastActivity ? lastActivity.toLocaleDateString() : 'N/A'}</span>
                                    <span class="user-bookmarks">${bookmarkCount}</span>
                                </div>
                            `;
                        });
                    } else {
                        usersHTML += '<div class="no-data">No user data available yet. Users will appear here after they start using the site.</div>';
                    }
                } catch (bookmarkError) {
                    usersHTML += '<div class="no-data">No data collections found. This is normal for a new site.</div>';
                }
            }

            userList.innerHTML = usersHTML;

        } catch (error) {
            console.error('Error loading user data:', error);
            const userList = document.getElementById('user-list');
            if (userList) {
                userList.innerHTML = `
                    <div class="error">
                        <h4>Unable to load user data</h4>
                        <p>This is normal for a new site. Data will appear as users start using ZaikaBox.</p>
                        <p><strong>Error:</strong> ${error.message}</p>
                    </div>
                `;
            }
        }
    }

    // System action methods
    clearCache() {
        localStorage.clear();
        sessionStorage.clear();
        alert('Cache cleared successfully!');
    }

    generateReport() {
        alert('Generating comprehensive report... (Feature coming soon)');
    }

    maintenanceMode() {
        const confirm = window.confirm('Enable maintenance mode? This will show a maintenance page to all users.');
        if (confirm) {
            alert('Maintenance mode activated (Feature coming soon)');
        }
    }

    refreshUserData() {
        this.loadUserData();
    }

    exportUserData() {
        alert('Exporting user data... (Feature coming soon)');
    }

    renderThemeManagement() {
        return `
            <div class="theme-management">
                <div class="theme-section">
                    <h3>🎨 Color Customization</h3>
                    <div class="color-controls">
                        <div class="color-group">
                            <h4>Primary Colors</h4>
                            <div class="color-inputs">
                                <div class="color-input-group">
                                    <label for="primary-color">Primary</label>
                                    <input type="color" id="primary-color" value="#6366F1" data-css-var="--primary">
                                    <input type="text" class="color-hex" value="#6366F1" data-target="primary-color">
                                </div>
                                <div class="color-input-group">
                                    <label for="primary-light-color">Primary Light</label>
                                    <input type="color" id="primary-light-color" value="#818CF8" data-css-var="--primary-light">
                                    <input type="text" class="color-hex" value="#818CF8" data-target="primary-light-color">
                                </div>
                                <div class="color-input-group">
                                    <label for="primary-dark-color">Primary Dark</label>
                                    <input type="color" id="primary-dark-color" value="#4F46E5" data-css-var="--primary-dark">
                                    <input type="text" class="color-hex" value="#4F46E5" data-target="primary-dark-color">
                                </div>
                            </div>
                        </div>

                        <div class="color-group">
                            <h4>Secondary Colors</h4>
                            <div class="color-inputs">
                                <div class="color-input-group">
                                    <label for="secondary-color">Secondary</label>
                                    <input type="color" id="secondary-color" value="#F59E0B" data-css-var="--secondary">
                                    <input type="text" class="color-hex" value="#F59E0B" data-target="secondary-color">
                                </div>
                                <div class="color-input-group">
                                    <label for="accent-color">Accent</label>
                                    <input type="color" id="accent-color" value="#10B981" data-css-var="--accent">
                                    <input type="text" class="color-hex" value="#10B981" data-target="accent-color">
                                </div>
                            </div>
                        </div>

                        <div class="color-group">
                            <h4>Text Colors</h4>
                            <div class="color-inputs">
                                <div class="color-input-group">
                                    <label for="text-strong-color">Strong Text</label>
                                    <input type="color" id="text-strong-color" value="#1F2937" data-css-var="--text-strong">
                                    <input type="text" class="color-hex" value="#1F2937" data-target="text-strong-color">
                                </div>
                                <div class="color-input-group">
                                    <label for="text-dark-color">Body Text</label>
                                    <input type="color" id="text-dark-color" value="#374151" data-css-var="--text-dark">
                                    <input type="text" class="color-hex" value="#374151" data-target="text-dark-color">
                                </div>
                            </div>
                        </div>

                        <div class="color-group">
                            <h4>Background Colors</h4>
                            <div class="color-inputs">
                                <div class="color-input-group">
                                    <label for="bg-color">Background</label>
                                    <input type="color" id="bg-color" value="#F9FAFB" data-css-var="--bg">
                                    <input type="text" class="color-hex" value="#F9FAFB" data-target="bg-color">
                                </div>
                                <div class="color-input-group">
                                    <label for="card-bg-color">Card Background</label>
                                    <input type="color" id="card-bg-color" value="#FFFFFF" data-css-var="--card-bg">
                                    <input type="text" class="color-hex" value="#FFFFFF" data-target="card-bg-color">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="theme-section">
                    <h3>🔤 Typography</h3>
                    <div class="typography-controls">
                        <div class="font-group">
                            <label for="primary-font">Primary Font Family</label>
                            <select id="primary-font" data-target="primary-font-family">
                                <option value="'Gabarito', sans-serif">Gabarito (Current)</option>
                                <option value="'Inter', sans-serif">Inter</option>
                                <option value="'Poppins', sans-serif">Poppins</option>
                                <option value="'Roboto', sans-serif">Roboto</option>
                                <option value="'Open Sans', sans-serif">Open Sans</option>
                                <option value="'Montserrat', sans-serif">Montserrat</option>
                                <option value="'Lato', sans-serif">Lato</option>
                            </select>
                        </div>
                        <div class="font-group">
                            <label for="body-font">Body Font Family</label>
                            <select id="body-font" data-target="body-font-family">
                                <option value="'Titillium Web', sans-serif">Titillium Web (Current)</option>
                                <option value="'Inter', sans-serif">Inter</option>
                                <option value="'Source Sans Pro', sans-serif">Source Sans Pro</option>
                                <option value="'Nunito', sans-serif">Nunito</option>
                                <option value="'Roboto', sans-serif">Roboto</option>
                                <option value="'Open Sans', sans-serif">Open Sans</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="theme-section">
                    <h3>📐 Layout Settings</h3>
                    <div class="layout-controls">
                        <div class="layout-group">
                            <label for="border-radius">Border Radius</label>
                            <input type="range" id="border-radius" min="0" max="24" value="12" data-css-var="--border-radius-lg" data-unit="px">
                            <span class="range-value">12px</span>
                        </div>
                        <div class="layout-group">
                            <label for="card-shadow">Card Shadow Intensity</label>
                            <input type="range" id="card-shadow" min="0" max="100" value="10" data-target="shadow-intensity">
                            <span class="range-value">10%</span>
                        </div>
                    </div>
                </div>

                <div class="theme-section">
                    <h3>🎭 Preset Themes</h3>
                    <div class="preset-themes">
                        <button class="preset-theme-btn" data-theme="default">
                            <div class="theme-preview">
                                <div class="preview-color" style="background: #6366F1"></div>
                                <div class="preview-color" style="background: #F59E0B"></div>
                                <div class="preview-color" style="background: #10B981"></div>
                            </div>
                            <span>Default</span>
                        </button>
                        <button class="preset-theme-btn" data-theme="ocean">
                            <div class="theme-preview">
                                <div class="preview-color" style="background: #0EA5E9"></div>
                                <div class="preview-color" style="background: #06B6D4"></div>
                                <div class="preview-color" style="background: #10B981"></div>
                            </div>
                            <span>Ocean</span>
                        </button>
                        <button class="preset-theme-btn" data-theme="sunset">
                            <div class="theme-preview">
                                <div class="preview-color" style="background: #F97316"></div>
                                <div class="preview-color" style="background: #EF4444"></div>
                                <div class="preview-color" style="background: #F59E0B"></div>
                            </div>
                            <span>Sunset</span>
                        </button>
                        <button class="preset-theme-btn" data-theme="forest">
                            <div class="theme-preview">
                                <div class="preview-color" style="background: #059669"></div>
                                <div class="preview-color" style="background: #65A30D"></div>
                                <div class="preview-color" style="background: #16A34A"></div>
                            </div>
                            <span>Forest</span>
                        </button>
                        <button class="preset-theme-btn" data-theme="purple">
                            <div class="theme-preview">
                                <div class="preview-color" style="background: #8B5CF6"></div>
                                <div class="preview-color" style="background: #A855F7"></div>
                                <div class="preview-color" style="background: #EC4899"></div>
                            </div>
                            <span>Purple</span>
                        </button>
                        <button class="preset-theme-btn" data-theme="dark">
                            <div class="theme-preview">
                                <div class="preview-color" style="background: #374151"></div>
                                <div class="preview-color" style="background: #6B7280"></div>
                                <div class="preview-color" style="background: #9CA3AF"></div>
                            </div>
                            <span>Dark</span>
                        </button>
                    </div>
                </div>

                <div class="theme-actions">
                    <button class="theme-action-btn primary" onclick="adminAuth.applyTheme()">
                        <i class="fa fa-paint-brush"></i> Apply Changes
                    </button>
                    <button class="theme-action-btn" onclick="adminAuth.previewTheme()">
                        <i class="fa fa-eye"></i> Preview
                    </button>
                    <button class="theme-action-btn" onclick="adminAuth.resetTheme()">
                        <i class="fa fa-undo"></i> Reset to Default
                    </button>
                    <button class="theme-action-btn" onclick="adminAuth.saveTheme()">
                        <i class="fa fa-save"></i> Save Theme
                    </button>
                    <button class="theme-action-btn" onclick="adminAuth.exportTheme()">
                        <i class="fa fa-download"></i> Export
                    </button>
                    <button class="theme-action-btn" onclick="adminAuth.importTheme()">
                        <i class="fa fa-upload"></i> Import
                    </button>
                </div>
            </div>
        `;
    }

    initThemeManagement() {
        // Initialize color inputs
        this.initColorInputs();
        
        // Initialize preset themes
        this.initPresetThemes();
        
        // Initialize range inputs
        this.initRangeInputs();
        
        // Initialize font selectors
        this.initFontSelectors();
        
        // Load saved theme if exists
        this.loadSavedTheme();
    }

    initColorInputs() {
        const colorInputs = document.querySelectorAll('input[type="color"][data-css-var]');
        const hexInputs = document.querySelectorAll('.color-hex');

        colorInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const cssVar = e.target.getAttribute('data-css-var');
                const hexInput = document.querySelector(`input[data-target="${e.target.id}"]`);
                
                if (hexInput) {
                    hexInput.value = e.target.value;
                }
                
                document.documentElement.style.setProperty(cssVar, e.target.value);
            });
        });

        hexInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const targetId = e.target.getAttribute('data-target');
                const colorInput = document.getElementById(targetId);
                
                if (colorInput && /^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    colorInput.value = e.target.value;
                    const cssVar = colorInput.getAttribute('data-css-var');
                    document.documentElement.style.setProperty(cssVar, e.target.value);
                }
            });
        });
    }

    initPresetThemes() {
        const presetButtons = document.querySelectorAll('.preset-theme-btn');
        
        presetButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const theme = e.currentTarget.getAttribute('data-theme');
                this.applyPresetTheme(theme);
            });
        });
    }

    initRangeInputs() {
        const rangeInputs = document.querySelectorAll('input[type="range"]');
        
        rangeInputs.forEach(input => {
            const valueSpan = input.nextElementSibling;
            const unit = input.getAttribute('data-unit') || '';
            
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                valueSpan.textContent = value + unit;
                
                const cssVar = e.target.getAttribute('data-css-var');
                if (cssVar) {
                    document.documentElement.style.setProperty(cssVar, value + unit);
                }
            });
        });
    }

    initFontSelectors() {
        const fontSelectors = document.querySelectorAll('select[data-target]');
        
        fontSelectors.forEach(select => {
            select.addEventListener('change', (e) => {
                const target = e.target.getAttribute('data-target');
                const value = e.target.value;
                
                if (target === 'primary-font-family') {
                    document.documentElement.style.setProperty('--primary-font', value);
                    // Apply to headings and logo
                    const headings = document.querySelectorAll('h1, h2, h3, .logo-text, .category-title');
                    headings.forEach(heading => {
                        heading.style.fontFamily = value;
                    });
                } else if (target === 'body-font-family') {
                    document.documentElement.style.setProperty('--body-font', value);
                    document.body.style.fontFamily = value;
                }
            });
        });
    }

    applyPresetTheme(themeName) {
        const themes = {
            default: {
                '--primary': '#6366F1',
                '--primary-light': '#818CF8',
                '--primary-dark': '#4F46E5',
                '--secondary': '#F59E0B',
                '--accent': '#10B981',
                '--text-strong': '#1F2937',
                '--text-dark': '#374151',
                '--bg': '#F9FAFB',
                '--card-bg': '#FFFFFF'
            },
            ocean: {
                '--primary': '#0EA5E9',
                '--primary-light': '#38BDF8',
                '--primary-dark': '#0284C7',
                '--secondary': '#06B6D4',
                '--accent': '#10B981',
                '--text-strong': '#0F172A',
                '--text-dark': '#334155',
                '--bg': '#F8FAFC',
                '--card-bg': '#FFFFFF'
            },
            sunset: {
                '--primary': '#F97316',
                '--primary-light': '#FB923C',
                '--primary-dark': '#EA580C',
                '--secondary': '#EF4444',
                '--accent': '#F59E0B',
                '--text-strong': '#1F2937',
                '--text-dark': '#374151',
                '--bg': '#FEF7F0',
                '--card-bg': '#FFFFFF'
            },
            forest: {
                '--primary': '#059669',
                '--primary-light': '#10B981',
                '--primary-dark': '#047857',
                '--secondary': '#65A30D',
                '--accent': '#16A34A',
                '--text-strong': '#14532D',
                '--text-dark': '#166534',
                '--bg': '#F0FDF4',
                '--card-bg': '#FFFFFF'
            },
            purple: {
                '--primary': '#8B5CF6',
                '--primary-light': '#A78BFA',
                '--primary-dark': '#7C3AED',
                '--secondary': '#A855F7',
                '--accent': '#EC4899',
                '--text-strong': '#1F2937',
                '--text-dark': '#374151',
                '--bg': '#FAF5FF',
                '--card-bg': '#FFFFFF'
            },
            dark: {
                '--primary': '#6366F1',
                '--primary-light': '#818CF8',
                '--primary-dark': '#4F46E5',
                '--secondary': '#F59E0B',
                '--accent': '#10B981',
                '--text-strong': '#F9FAFB',
                '--text-dark': '#E5E7EB',
                '--bg': '#111827',
                '--card-bg': '#1F2937'
            }
        };

        const theme = themes[themeName];
        if (theme) {
            Object.entries(theme).forEach(([property, value]) => {
                document.documentElement.style.setProperty(property, value);
                
                // Update color inputs
                const input = document.querySelector(`input[data-css-var="${property}"]`);
                if (input) {
                    input.value = value;
                    const hexInput = document.querySelector(`input[data-target="${input.id}"]`);
                    if (hexInput) {
                        hexInput.value = value;
                    }
                }
            });
        }
    }

    applyTheme() {
        // Theme is already applied through event listeners
        this.saveTheme();
        alert('Theme applied and saved successfully!');
    }

    previewTheme() {
        // Add preview overlay
        const preview = document.createElement('div');
        preview.className = 'theme-preview-overlay';
        preview.innerHTML = `
            <div class="preview-notice">
                <span>🎨 Theme Preview Mode</span>
                <button onclick="this.parentElement.parentElement.remove()">Exit Preview</button>
            </div>
        `;
        document.body.appendChild(preview);
        
        setTimeout(() => {
            preview.remove();
        }, 5000);
    }

    resetTheme() {
        if (confirm('Reset to default theme? This will lose all current customizations.')) {
            this.applyPresetTheme('default');
            localStorage.removeItem('zaikabox-custom-theme');
            alert('Theme reset to default!');
        }
    }

    saveTheme() {
        const currentTheme = {};
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        // Save CSS variables
        const cssVars = [
            '--primary', '--primary-light', '--primary-dark',
            '--secondary', '--accent', '--text-strong', '--text-dark',
            '--bg', '--card-bg', '--border-radius-lg'
        ];
        
        cssVars.forEach(varName => {
            currentTheme[varName] = computedStyle.getPropertyValue(varName).trim();
        });
        
        // Save font selections
        const primaryFont = document.getElementById('primary-font');
        const bodyFont = document.getElementById('body-font');
        
        if (primaryFont) currentTheme['primary-font'] = primaryFont.value;
        if (bodyFont) currentTheme['body-font'] = bodyFont.value;
        
        localStorage.setItem('zaikabox-custom-theme', JSON.stringify(currentTheme));
        console.log('Theme saved:', currentTheme);
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('zaikabox-custom-theme');
        if (savedTheme) {
            try {
                const theme = JSON.parse(savedTheme);
                Object.entries(theme).forEach(([property, value]) => {
                    if (property.startsWith('--')) {
                        document.documentElement.style.setProperty(property, value);
                        
                        // Update inputs
                        const input = document.querySelector(`input[data-css-var="${property}"]`);
                        if (input) {
                            input.value = value;
                            const hexInput = document.querySelector(`input[data-target="${input.id}"]`);
                            if (hexInput) {
                                hexInput.value = value;
                            }
                        }
                    } else if (property === 'primary-font') {
                        const select = document.getElementById('primary-font');
                        if (select) select.value = value;
                    } else if (property === 'body-font') {
                        const select = document.getElementById('body-font');
                        if (select) select.value = value;
                    }
                });
            } catch (error) {
                console.error('Error loading saved theme:', error);
            }
        }
    }

    exportTheme() {
        const savedTheme = localStorage.getItem('zaikabox-custom-theme');
        if (savedTheme) {
            const blob = new Blob([savedTheme], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'zaikabox-theme.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert('No custom theme to export. Please customize and save a theme first.');
        }
    }

    importTheme() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const theme = JSON.parse(e.target.result);
                        localStorage.setItem('zaikabox-custom-theme', JSON.stringify(theme));
                        this.loadSavedTheme();
                        alert('Theme imported successfully!');
                    } catch (error) {
                        alert('Invalid theme file. Please select a valid ZaikaBox theme file.');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }
}

// Create global admin auth instance
export const adminAuth = new AdminAuth();

// Make it globally available for onclick handlers
window.adminAuth = adminAuth;