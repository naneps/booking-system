import type {
    RouteLocationMatched,
    RouteLocationNormalizedLoaded,
} from "vue-router";
import { ROUTE_ICON_MAP } from "~/constants/routeIcons";

export type Crumb = {label: string; to?: string; icon?: string};

function humanize(input = "") {
  return input
    .replace(/\[|\]|\.\.\.|_/g, " ")
    .replace(/-/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^\w/g, (c) => c.toUpperCase());
}

function labelFromRecord(
  rec: RouteLocationMatched,
  cur: RouteLocationNormalizedLoaded,
) {
  const meta: any = rec.meta || {};
  const bc = meta.breadcrumb ?? meta.title;
  if (typeof bc === "function") return bc(cur);
  if (typeof bc === "string") return bc;
  const seg = rec.path.split("/").filter(Boolean).pop() || "";
  return humanize(seg);
}

function lookupIcon(pathOrName: string) {
  // cari icon default dari ROUTE_ICON_MAP
  const keys = Object.keys(ROUTE_ICON_MAP).sort((a, b) => b.length - a.length);
  for (const key of keys)
    if (pathOrName.startsWith(key)) return ROUTE_ICON_MAP[key];
  return undefined;
}

export function useBreadcrumbs(opts?: {
  hideRoot?: boolean;
  rootLabel?: string;
  rootTo?: string;
  excludeNames?: string[];
  trailingLink?: boolean;
}) {
  const route = useRoute();
  const router = useRouter();

  const items = computed<Crumb[]>(() => {
    const out: Crumb[] = [];

    // ROOT crumb (Home)
    if (!opts?.hideRoot) {
      out.push({
        label: opts?.rootLabel ?? "Home",
        to: opts?.rootTo ?? "/",
        icon: "i-lucide-house",
      });
    }

    // records yang match selain root
    const matched = route.matched
      .filter((r) => r.path !== "/")
      .filter((r) => !opts?.excludeNames?.includes(String(r.name ?? "")));

    // ===== auto section crumb: '/master-data' dari path saat ini
    const segs = route.path.split("/").filter(Boolean);
    const sectionPath = segs.length ? `/${segs[0]}` : "/";
    const hasSectionInMatched = matched.some((r) => r.path === sectionPath);

    if (sectionPath !== "/" && !hasSectionInMatched) {
      out.push({
        label: humanize(segs[0]),
        to: sectionPath,
        icon: lookupIcon(sectionPath),
      });
    }
    // ===== end auto section
    // ===== auto sub-section crumb: '/master-data/users'
    const subPath = segs.length >= 2 ? `/${segs[0]}/${segs[1]}` : null;
    const hasSubInMatched = subPath
      ? matched.some((r) => r.path === subPath)
      : false;

    if (subPath && !hasSubInMatched) {
      out.push({
        label: humanize(segs[1]),
        to: subPath,
        icon: lookupIcon(subPath),
      });
    }
    // ===== end auto sub-section
    // crumbs dari matched
    matched.forEach((rec, idx) => {
      const isLast = idx === matched.length - 1;
      const label = labelFromRecord(rec, route);

      // icon dari meta atau map default
      const meta: any = rec.meta || {};
      const metaIcon =
        typeof meta.breadcrumbIcon === "function"
          ? meta.breadcrumbIcon(route)
          : meta.breadcrumbIcon ||
            (typeof meta.icon === "function" ? meta.icon(route) : meta.icon);
      const icon = metaIcon || lookupIcon(rec.path || String(rec.name ?? ""));

      let to: string | undefined;
      if (!isLast || opts?.trailingLink) {
        try {
          to = rec.name
            ? router.resolve({name: rec.name as any, params: route.params}).href
            : router.resolve({path: rec.path}).href;
        } catch {
          /* ignore */
        }
      }
      out.push({label, to, icon});
    });

    return out;
  });

  return {items};
}
