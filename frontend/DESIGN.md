# Outlive Admin - Design System

## Color Palette

### Primary Gradient (Warm)
Used for primary actions, active states, and highlights.

```css
/* Gradient: Peach to Coral */
--primary-gradient: linear-gradient(135deg, #fdb482, #ff7c66);

/* Individual colors */
--primary-peach: #fdb482;
--primary-coral: #ff7c66;
```

### Secondary Gradient (Cool)
Used for secondary elements and accents.

```css
/* Gradient: Blue to Cyan */
--secondary-gradient: linear-gradient(135deg, hsl(209, 100%, 60%), #5adfff);

/* Individual colors */
--secondary-blue: hsl(209, 100%, 60%);  /* #1a8cff */
--secondary-cyan: #5adfff;
```

### Neutral Colors

```css
/* Light Mode */
--bg-primary: #ffffff;
--bg-secondary: #f5f5f5;
--bg-tertiary: #e5e5e5;
--text-primary: #171717;
--text-secondary: #525252;
--text-muted: #a3a3a3;
--border: #e5e5e5;

/* Dark Mode */
--bg-primary-dark: #0a0a0a;
--bg-secondary-dark: #171717;
--bg-tertiary-dark: #262626;
--text-primary-dark: #fafafa;
--text-secondary-dark: #a3a3a3;
--text-muted-dark: #525252;
--border-dark: #262626;
```

## Typography

- **Font Family**: System UI stack (Inter, SF Pro, etc.)
- **Headings**: font-weight: 600-700
- **Body**: font-weight: 400-500
- **Small/Labels**: font-weight: 500, uppercase for labels

## Spacing

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;
--spacing-2xl: 32px;
```

## Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 22px;
--radius-full: 9999px;
```

## Components

### Sidebar
- Width: 240px (expanded), 72px (collapsed)
- Margin: 10px
- Border radius: 22px
- Background: Solid with subtle gradient overlay
- No shadow, no outline

### Buttons
- Primary: Uses primary gradient
- Secondary: Outlined with neutral colors
- Border radius: 8px (small), 12px (medium)

### Cards
- Background: White (light) / Neutral-900 (dark)
- Border: 1px solid border color
- Border radius: 16px
- Padding: 16px-24px

### Form Inputs
- Height: 40px
- Border radius: 8px
- Border: 1px solid
- Focus: Primary color ring

## Icons

Using [Hugeicons](https://hugeicons.com/react-icons) - Free tier icons.

### Packages Required
- `@hugeicons/react` - Rendering component
- `@hugeicons/core-free-icons` - Free icon set (4,600+ icons)

### Import Pattern
```tsx
import { HugeiconsIcon } from '@hugeicons/react';
import { Home01Icon, UserMultipleIcon } from '@hugeicons/core-free-icons';

// Usage
<HugeiconsIcon icon={Home01Icon} size={20} color="currentColor" />
```

### Available Icons (commonly used)
- `Home01Icon` - Dashboard/Home
- `UserMultipleIcon` - Users/Patients
- `Tag01Icon` - Categories/Tags
- `Package01Icon` - Products/Packages
- `File02Icon` - Documents/Logs
- `UserSettings01Icon` - Admin/Settings
- `Message01Icon` - Messages/Chat
- `Logout01Icon` - Logout
- `Moon01Icon` - Dark mode
- `Sun03Icon` - Light mode
- `SidebarLeftIcon` - Collapse sidebar
- `SidebarRightIcon` - Expand sidebar

## Transitions

```css
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;
```

## File Structure

```
frontend/src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── Sidebar.tsx      # Main navigation sidebar
│   └── ...
├── layouts/
│   └── AdminLayout.tsx  # Main layout with sidebar
├── styles/
│   └── globals.css      # Global styles and CSS variables
└── ...
```

## Tailwind Classes Reference

### Primary Gradient
```html
<div class="bg-gradient-to-r from-[#fdb482] to-[#ff7c66]">
```

### Secondary Gradient
```html
<div class="bg-gradient-to-r from-[hsl(209,100%,60%)] to-[#5adfff]">
```

### Sidebar Container
```html
<aside class="m-2.5 rounded-[22px] bg-white dark:bg-neutral-900">
```
