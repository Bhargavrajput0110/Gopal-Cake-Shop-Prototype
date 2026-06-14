# Gopal Cake Shop Prototype

This is the prototype branch for the **Gopal Cake Shop Internal Kitchen Display & Delivery System**.

## Prototype Access

Since this is a prototype, dummy authentication has been set up to allow stakeholders to view the platform from the perspective of different staff roles.

### Dummy Credentials

| Role | Email | Password | Dashboard URL |
| :--- | :--- | :--- | :--- |
| **Admin/Owner** | `admin@gopal.com` | `admin123` | `/admin` |
| **Sales POS** | `sales@gopal.com` | `sales123` | `/sales` |
| **Chef (KDS)** | `chef@gopal.com` | `chef123` | `/chef` |
| **Delivery** | `delivery@gopal.com` | `delivery123` | `/delivery` |

*(Note: The login screen also includes "Quick Access" buttons so you don't have to manually type these in during the prototype phase).*

## Features Built So Far
- **Premium Dark Mode / Glassmorphism UI** optimized for all mobile screens and POS tablets.
- **Admin Command Centre**: Tracks revenue, uncollected balances, and active deliveries across 4 branches.
- **Sales Manual POS**: Walk-in & priority order entry with image uploading.
- **Chef KDS**: Kanban-style kitchen display system.
- **Delivery App**: Native mobile app feel for delivery agents to mark drops as complete and collect cash.

## Tech Stack
- Next.js 16 (App Router)
- TailwindCSS
- Framer Motion & MagicUI (Micro-animations)
- Lucide/Iconsax (Premium Icons)

## Local Development
First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
