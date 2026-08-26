from pathlib import Path

p = Path(r"E:\GlowUP-build\glowkiss-main\src\routeTree.gen.ts")
t = p.read_text(encoding="utf-8")
if "dashboard.ops" in t and "DashboardOpsRoute" in t and "DashboardOpsRoute," in t:
    print("already wired")
    raise SystemExit(0)

if "dashboard.ops" not in t:
    t = t.replace(
        "import { Route as DashboardClientsRouteImport } from './routes/dashboard.clients'",
        "import { Route as DashboardClientsRouteImport } from './routes/dashboard.clients'\n"
        "import { Route as DashboardOpsRouteImport } from './routes/dashboard.ops'",
    )

if "const DashboardOpsRoute" not in t:
    t = t.replace(
        """const DashboardClientsRoute = DashboardClientsRouteImport.update({
  id: '/clients',
  path: '/clients',
  getParentRoute: () => DashboardRoute,
} as any)""",
        """const DashboardClientsRoute = DashboardClientsRouteImport.update({
  id: '/clients',
  path: '/clients',
  getParentRoute: () => DashboardRoute,
} as any)
const DashboardOpsRoute = DashboardOpsRouteImport.update({
  id: '/ops',
  path: '/ops',
  getParentRoute: () => DashboardRoute,
} as any)""",
    )

# Type maps - insert ops after clients wherever clients appears as typeof line
replacements = [
    (
        "'/dashboard/clients': typeof DashboardClientsRoute\n  '/dashboard/concierge': typeof DashboardConciergeRoute",
        "'/dashboard/clients': typeof DashboardClientsRoute\n  '/dashboard/ops': typeof DashboardOpsRoute\n  '/dashboard/concierge': typeof DashboardConciergeRoute",
    ),
    (
        "| '/dashboard/clients'\n    | '/dashboard/concierge'",
        "| '/dashboard/clients'\n    | '/dashboard/ops'\n    | '/dashboard/concierge'",
    ),
]
for a, b in replacements:
    t = t.replace(a, b)

if "'/dashboard/ops': {" not in t:
    t = t.replace(
        """'/dashboard/clients': {
      id: '/dashboard/clients'
      path: '/clients'
      fullPath: '/dashboard/clients'
      preLoaderRoute: typeof DashboardClientsRouteImport
      parentRoute: typeof DashboardRoute
    }""",
        """'/dashboard/clients': {
      id: '/dashboard/clients'
      path: '/clients'
      fullPath: '/dashboard/clients'
      preLoaderRoute: typeof DashboardClientsRouteImport
      parentRoute: typeof DashboardRoute
    }
    '/dashboard/ops': {
      id: '/dashboard/ops'
      path: '/ops'
      fullPath: '/dashboard/ops'
      preLoaderRoute: typeof DashboardOpsRouteImport
      parentRoute: typeof DashboardRoute
    }""",
    )

if "DashboardOpsRoute: typeof DashboardOpsRoute" not in t:
    t = t.replace(
        "DashboardClientsRoute: typeof DashboardClientsRoute\n  DashboardConciergeRoute:",
        "DashboardClientsRoute: typeof DashboardClientsRoute\n  DashboardOpsRoute: typeof DashboardOpsRoute\n  DashboardConciergeRoute:",
    )
if "DashboardOpsRoute: DashboardOpsRoute," not in t:
    t = t.replace(
        "DashboardClientsRoute: DashboardClientsRoute,\n  DashboardConciergeRoute:",
        "DashboardClientsRoute: DashboardClientsRoute,\n  DashboardOpsRoute: DashboardOpsRoute,\n  DashboardConciergeRoute:",
    )

p.write_text(t, encoding="utf-8")
print("wired", "DashboardOpsRoute" in p.read_text(encoding="utf-8"))
