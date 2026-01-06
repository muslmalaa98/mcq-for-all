function normalizeBase(base) {
  // base ends with /
  const b = (base || "/").replace(/\/+$/, "");
  return b === "" ? "/" : b;
}

export function createRouter({ base, onRoute }) {
  const baseNoSlash = normalizeBase(base); // "/mcq"
  const baseWithSlash = baseNoSlash === "/" ? "/" : `${baseNoSlash}/`;

  function parse(pathname) {
    // Expect routes under base
    if (baseNoSlash !== "/" && !pathname.startsWith(baseNoSlash)) {
      return { segments: [], outsideBase: true };
    }

    let rest = baseNoSlash === "/" ? pathname : pathname.slice(baseNoSlash.length);
    if (rest === "") rest = "/";
    const segments = rest.split("/").filter(Boolean);
    return { segments, outsideBase: false };
  }

  async function dispatch() {
    const route = parse(window.location.pathname);
    if (route.outsideBase) {
      // force into base
      navigate(baseWithSlash);
      return;
    }
    await onRoute(route);
  }

  function navigate(to) {
    // allow absolute paths
    const url = new URL(to, window.location.origin);
    history.pushState({}, "", url.pathname + url.search + url.hash);
    dispatch();
  }

  function start() {
    window.addEventListener("popstate", dispatch);
    dispatch();
  }

  return { start, navigate, parse };
}
