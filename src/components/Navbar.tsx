type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { label: "Tasks", href: "tasks" },
  { label: "Timer", href: "timer" },
  { label: "Analytics", href: "analytics" },
];

function Navbar() {
  return (
    // role="navigation" triggers Pico’s hamburger on small screens
    <nav role="navigation" className="px-12 bg-[#0E1118]">
      {/* Brand */}
      <ul>
        <li>
          <a className="text-xl contrast" href="/">
            <strong>Lock In ✨</strong>
          </a>
        </li>
      </ul>
      {/* Nav links */}
      <ul>
        {navItems.map((item) => (
          <li key={item.href}>
            <a href={`/dash/${item.href}`} className="contrast">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;
