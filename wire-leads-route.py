from pathlib import Path

p = Path(r"E:\GlowUP-build\glowkiss-main\src\routeTree.gen.ts")
t = p.read_text(encoding="utf-8")

if "dashboard.leads" in t and "DashboardLeadsRoute: DashboardLeadsRoute" in t:
    print("already wired")
    raise SystemExit(0)

if "dashboard.leads" not in t:
    t = t.replace(
        "import { Route as DashboardOpsRouteImport } from './routes/dashboard.ops'",
        "import { Route as DashboardOpsRouteImport } from './routes/dashboard.ops'\n"
        "import { Route as DashboardLeadsRouteImport } from './routes/dashboard.leads'",
    )

if "const DashboardLeadsRoute" not in t:
    t = t.replace(
        """const DashboardOpsRoute = DashboardOpsRouteImport.update({
  id: '/ops',
  path: '/ops',
  getParentRoute: () => DashboardRoute,
} as any)""",
        """const DashboardOpsRoute = DashboardOpsRouteImport.update({
  id: '/ops',
  path: '/ops',
  getParentRoute: () => DashboardRoute,
} as any)
const DashboardLeadsRoute = DashboardLeadsRouteImport.update({
  id: '/leads',
  path: '/leads',
  getParentRoute: () => DashboardRoute,
} as any)""",
    )

replacements = [
    (
        "'/dashboard/ops': typeof DashboardOpsRoute\n  '/dashboard/concierge': typeof DashboardConciergeRoute",
        "'/dashboard/ops': typeof DashboardOpsRoute\n  '/dashboard/leads': typeof DashboardLeadsRoute\n  '/dashboard/concierge': typeof DashboardConciergeRoute",
    ),
    (
        "| '/dashboard/ops'\n    | '/dashboard/concierge'",
        "| '/dashboard/ops'\n    | '/dashboard/leads'\n    | '/dashboard/concierge'",
    ),
]
for a, b in replacements:
    t = t.replace(a, b)

if "'/dashboard/leads': {" not in t:
    t = t.replace(
        """'/dashboard/ops': {
      id: '/dashboard/ops'
      path: '/ops'
      fullPath: '/dashboard/ops'
      preLoaderRoute: typeof DashboardOpsRouteImport
      parentRoute: typeof DashboardRoute
    }""",
        """'/dashboard/ops': {
      id: '/dashboard/ops'
      path: '/ops'
      fullPath: '/dashboard/ops'
      preLoaderRoute: typeof DashboardOpsRouteImport
      parentRoute: typeof DashboardRoute
    }
    '/dashboard/leads': {
      id: '/dashboard/leads'
      path: '/leads'
      fullPath: '/dashboard/leads'
      preLoaderRoute: typeof DashboardLeadsRouteImport
      parentRoute: typeof DashboardRoute
    }""",
    )

if "DashboardLeadsRoute: typeof DashboardLeadsRoute" not in t:
    t = t.replace(
        "DashboardOpsRoute: typeof DashboardOpsRoute\n  DashboardConciergeRoute:",
        "DashboardOpsRoute: typeof DashboardOpsRoute\n  DashboardLeadsRoute: typeof DashboardLeadsRoute\n  DashboardConciergeRoute:",
    )
if "DashboardLeadsRoute: DashboardLeadsRoute," not in t:
    t = t.replace(
        "DashboardOpsRoute: DashboardOpsRoute,\n  DashboardConciergeRoute:",
        "DashboardOpsRoute: DashboardOpsRoute,\n  DashboardLeadsRoute: DashboardLeadsRoute,\n  DashboardConciergeRoute:",
    )

p.write_text(t, encoding="utf-8")
print("wired", "DashboardLeadsRoute" in p.read_text(encoding="utf-8"))
