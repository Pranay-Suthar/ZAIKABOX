// ================= Theme Management System =================
class ThemeManager {
    constructor() {
        this.themes = {
            default: {
                name: 'Default',
                colors: {
                    '--primary': '#6366F1',
                    '--primary-light': '#818CF8',
                    '--primary-dark': '#4F46E5',
                    '--secondary': '#F59E0B',
                    '--accent': '#10B981',
                    '--text-strong': '#1F2937',
                    '--text-dark': '#374151',
                    '--bg': '#F9FAFB',
                    '--card-bg': '#FFFFFF'
                }
            },
            ocean: {
                name: 'Ocean Breeze',
                colors: {
                    '--primary': '#0EA5E9',
                    '--primary-light': '#38BDF8',
                    '--primary-dark': '#0284C7',
                    '--secondary': '#06B6D4',
                    '--accent': '#10B981',
                    '--text-strong': '#0F172A',
                    '--text-dark': '#334155',
                    '--bg': '#F8FAFC',
                    '--card-bg': '#FFFFFF'
                }
            },
            sunset: {
                name: 'Sunset Glow',
                colors: {
                    '--primary': '#F97316',
                    '--primary-light': '#FB923C',
                    '--primary-dark': '#EA580C',
                    '--secondary': '#EF4444',
                    '--accent': '#F59E0B',
                    '--text-strong': '#1F2937',
                    '--text-dark': '#374151',
                    '--bg': '#FEF7F0',
                    '--card-bg': '#FFFFFF'
                }
            },
            forest: {
                name: 'Forest Fresh',
                colors: {
                    '--primary': '#059669',
                    '--primary-light': '#10B981',
                    '--primary-dark': '#047857',
                    '--secondary': '#65A30D',
                    '--accent': '#16A34A',
                    '--text-strong': '#14532D',
                    '--text-dark': '#166534',
                    '--bg': '#F0FDF4',
                    '--card-bg': '#FFFFFF'
                }
            },
            purple: {
                name: 'Purple Magic',
                colors: {
                    '--primary': '#8B5CF6',
                    '--primary-light': '#A78BFA',
                    '--primary-dark': '#7C3AED',
                    '--secondary': '#A855F7',
                    '--accent': '#EC4899',
                    '--text-strong': '#1F2937',
                    '--text-dark': '#374151',
                    '--bg': '#FAF5FF',
                    '--card-bg': '#FFFFFF'
                }
            },
            dark: {
                name: 'Dark Mode',
                colors: {
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
            }
        };
        
        this.init();
    }

    init() {
        this.loadSavedTheme();
        this.setupThemeToggle();
    }

    setupThemeToggle() {
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => this.openThemeSelector());
        }
    }

    openThemeSelector() {
        // Remove existing theme selector if open
        const existing = document.getElementById('theme-selector-modal');
        if (existing) {
            existing.remove();
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'theme-selector-modal';
        modal.className = 'theme-selector-modal';
        
        modal.innerHTML = `
            <div class="theme-selector-content">
                <div class="theme-selector-header">
                    <h3><i class="fa fa-palette"></i> Choose Your Theme</h3>
                    <button class="theme-close-btn" onclick="this.closest('.theme-selector-modal').remove()">&times;</button>
                </div>
                
                <div class="theme-grid">
                    ${Object.entries(this.themes).map(([key, theme]) => `
                        <div class="theme-option" data-theme="${key}">
                            <div class="theme-preview-card">
                                <div class="theme-colors">
                                    <div class="color-dot" style="background: ${theme.colors['--primary']}"></div>
                                    <div class="color-dot" style="background: ${theme.colors['--secondary']}"></div>
                                    <div class="color-dot" style="background: ${theme.colors['--accent']}"></div>
                                </div>
                                <div class="theme-sample">
                                    <div class="sample-header" style="background: ${theme.colors['--primary']}"></div>
                                    <div class="sample-content" style="background: ${theme.colors['--card-bg']}; color: ${theme.colors['--text-dark']}">
                                        <div class="sample-text" style="color: ${theme.colors['--text-strong']}"></div>
                                        <div class="sample-text small" style="color: ${theme.colors['--text-dark']}"></div>
                                    </div>
                                </div>
                            </div>
                            <h4>${theme.name}</h4>
                            <button class="apply-theme-btn" onclick="themeManager.applyTheme('${key}')">
                                Apply Theme
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <div class="theme-actions">
                    <button class="theme-action-btn" onclick="themeManager.resetToDefault()">
                        <i class="fa fa-undo"></i> Reset to Default
                    </button>
                    <button class="theme-action-btn" onclick="themeManager.randomTheme()">
                        <i class="fa fa-random"></i> Surprise Me!
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Highlight current theme
        const currentTheme = localStorage.getItem('zaikabox-theme') || 'default';
        const currentOption = modal.querySelector(`[data-theme="${currentTheme}"]`);
        if (currentOption) {
            currentOption.classList.add('active');
        }
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName];
        if (!theme) return;

        // Apply CSS variables
        Object.entries(theme.colors).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });

        // Save theme preference
        localStorage.setItem('zaikabox-theme', themeName);

        // Show success notification
        this.showNotification(`🎨 ${theme.name} theme applied!`);

        // Close modal
        const modal = document.getElementById('theme-selector-modal');
        if (modal) {
            modal.remove();
        }

        // Update active theme in selector if still open
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        const activeOption = document.querySelector(`[data-theme="${themeName}"]`);
        if (activeOption) {
            activeOption.classList.add('active');
        }
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('zaikabox-theme');
        if (savedTheme && this.themes[savedTheme]) {
            this.applyTheme(savedTheme);
        }
    }

    resetToDefault() {
        this.applyTheme('default');
        this.showNotification('🔄 Theme reset to default!');
    }

    randomTheme() {
        const themeKeys = Object.keys(this.themes);
        const randomKey = themeKeys[Math.floor(Math.random() * themeKeys.length)];
        this.applyTheme(randomKey);
        this.showNotification(`🎲 Random theme: ${this.themes[randomKey].name}!`);
    }

    showNotification(message) {
        // Remove existing notification
        const existing = document.querySelector('.theme-notification');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Method for admin or advanced users to create custom themes
    createCustomTheme(name, colors) {
        const customKey = `custom_${Date.now()}`;
        this.themes[customKey] = {
            name: name,
            colors: colors
        };
        
        // Save custom themes to localStorage
        const customThemes = JSON.parse(localStorage.getItem('zaikabox-custom-themes') || '{}');
        customThemes[customKey] = this.themes[customKey];
        localStorage.setItem('zaikabox-custom-themes', JSON.stringify(customThemes));
        
        return customKey;
    }

    loadCustomThemes() {
        const customThemes = JSON.parse(localStorage.getItem('zaikabox-custom-themes') || '{}');
        Object.assign(this.themes, customThemes);
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Make it globally available
window.themeManager = themeManager;

export default themeManager;